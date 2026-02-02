# ==============================================================================
# ARQUIVO: data_quality_engine.py
# DESCRIÇÃO: Script para validação de Data Quality no Databricks
# AUTOR: [Seu Nome]
# DATA: 2026-02-02
# ==============================================================================

from pyspark.sql import functions as F
from pyspark.sql.types import *
from datetime import datetime

# ==============================================================================
# 1. SETUP E DEFINIÇÕES (SCHEMA)
# ==============================================================================

# Schema da tabela final de saída (compatível com Power BI)
dq_output_schema = StructType([
    StructField("execution_date", DateType(), False),
    StructField("table_name", StringType(), False),
    StructField("column_name", StringType(), False),
    StructField("rule_category", StringType(), False),
    StructField("rule_name", StringType(), False),
    StructField("records_scanned", LongType(), False),
    StructField("records_failed", LongType(), False),
    StructField("dq_score", DoubleType(), False),
    StructField("status", StringType(), False),
    StructField("fail_logic_used", StringType(), True)
])

# ==============================================================================
# 2. GERAÇÃO DE DADOS FICTÍCIOS (PARA TESTE IMEDIATO)
# ==============================================================================
# Se estiver rodando em produção, você pode remover ou comentar este bloco.
print("🛠️ Gerando dados fictícios para teste...")

# Dados para tabela de períodos (alguns propositalmente errados para gerar falhas)
data_periodos = [
    (1, 1, 1),   # OK
    (5, 2, 1),   # OK
    (13, 1, 1),  # ERRO: Mês 13
    (2, 6, 1),   # ERRO: Trimestre 6
    (3, 2, 4)    # ERRO: Semestre 4
]
df_periodos = spark.createDataFrame(data_periodos, ["mes_referencia", "trimestre_fiscal", "semestre_letivo"])
df_periodos.createOrReplaceTempView("tb_periodos_fake")

# Dados para tabela de transações
data_transacoes = [
    (1001, 50.0),    # OK
    (1002, -20.0),   # ERRO: Valor negativo
    (None, 100.0)    # ERRO: ID Nulo
]
df_transacoes = spark.createDataFrame(data_transacoes, ["id_transacao", "valor_total"])
df_transacoes.createOrReplaceTempView("tb_transacoes_fake")

print("✅ Tabelas temporárias 'tb_periodos_fake' e 'tb_transacoes_fake' criadas.")

# ==============================================================================
# 3. ENGINE DE DATA QUALITY (FUNÇÃO PRINCIPAL)
# ==============================================================================

def run_dq_checks(dq_config_list):
    all_results = []
    current_date = datetime.now().date()
    
    print(f"\n🚀 Iniciando verificação de DQ em {len(dq_config_list)} tabelas...")

    for config in dq_config_list:
        table_name = config['table']
        print(f"--> Processando: {table_name}")
        
        try:
            df = spark.table(table_name)
            total_count = df.count()
            
            if total_count == 0:
                print(f"    ⚠️ Tabela vazia.")
                continue

            for rule in config['rules']:
                fail_expr = rule['fail_condition']
                
                # Executa a regra SQL
                failed_count = df.filter(F.expr(fail_expr)).count()
                
                score = 1.0 - (failed_count / total_count)
                threshold = rule.get('threshold', 1.0)
                status = "PASS" if score >= threshold else "FAIL"
                
                all_results.append((
                    current_date, table_name, rule['col'], rule['category'],
                    rule['name'], total_count, failed_count, float(score),
                    status, fail_expr
                ))
                
        except Exception as e:
            print(f"    ❌ Erro na tabela {table_name}: {str(e)}")

    if not all_results:
        return spark.createDataFrame([], schema=dq_output_schema)
    
    return spark.createDataFrame(all_results, schema=dq_output_schema)

# ==============================================================================
# 4. CONFIGURAÇÃO DAS REGRAS (DINÂMICAS + MANUAIS)
# ==============================================================================

# -- A. Regras Dinâmicas (Mês/Trimestre/Semestre) --
cols_mes = ["mes_referencia"]
cols_trim = ["trimestre_fiscal"]
cols_sem = ["semestre_letivo"]

regras_periodos = []

for col in cols_mes:
    regras_periodos.append({
        "name": f"check_validade_mes_{col}", "col": col, "category": "Validity",
        "fail_condition": f"{col} > 12 OR {col} < 1", "threshold": 1.0
    })

for col in cols_trim:
    regras_periodos.append({
        "name": f"check_validade_trim_{col}", "col": col, "category": "Validity",
        "fail_condition": f"{col} > 4 OR {col} < 1", "threshold": 1.0
    })

for col in cols_sem:
    regras_periodos.append({
        "name": f"check_validade_sem_{col}", "col": col, "category": "Validity",
        "fail_condition": f"{col} > 2 OR {col} < 1", "threshold": 1.0
    })

# -- B. Configuração Final --
dq_configs = [
    {
        "table": "tb_periodos_fake",
        "rules": regras_periodos # Apenas as regras dinâmicas
    },
    {
        "table": "tb_transacoes_fake",
        "rules": [
            {
                "name": "check_nulos_id", "col": "id_transacao", "category": "Completeness",
                "fail_condition": "id_transacao IS NULL", "threshold": 1.0
            },
            {
                "name": "check_valor_negativo", "col": "valor_total", "category": "Validity",
                "fail_condition": "valor_total < 0", "threshold": 0.99
            }
        ]
    }
]

# ==============================================================================
# 5. EXECUÇÃO E EXIBIÇÃO
# ==============================================================================

# Executa
df_final = run_dq_checks(dq_configs)

# Exibe resultado
print("\n📊 RESULTADO FINAL (Simulação):")
display(df_final)

# OBS: Para salvar, descomente as linhas abaixo:
# target_table = "default.f_data_quality_results"
# df_final.write.format("delta").mode("append").option("mergeSchema", "true").saveAsTable(target_table)