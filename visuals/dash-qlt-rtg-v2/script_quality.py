from pyspark.sql import functions as F
from pyspark.sql.types import *
from datetime import datetime

# ==============================================================================
# 1. INPUT: LISTA DE TABELAS A SEREM VERIFICADAS
# ==============================================================================
# BASTA EDITAR ESTA LISTA AQUI. O resto o código faz sozinho.
# Use o nome completo: catalog.schema.tabela ou schema.tabela
lista_tabelas = [
    "default.tb_periodos_fake",   # Exemplo
    "default.tb_transacoes_fake", # Exemplo
    # "gold.f_vendas",
    # "silver.d_clientes"
]

# ==============================================================================
# 2. DEFINIÇÃO DE SCHEMA (PADRÃO POWER BI)
# ==============================================================================
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
    StructField("fail_logic", StringType(), True)
])

# ==============================================================================
# 3. O "CEREBRO": GERADOR DE REGRAS AUTOMÁTICO
# ==============================================================================
def gerar_regras_automaticas(table_name):
    """
    Analisa as colunas da tabela e cria regras baseadas nos nomes.
    """
    regras = []
    
    try:
        # Lê apenas os metadados (rápido)
        df_meta = spark.table(table_name)
        colunas = df_meta.columns
        dtypes = dict(df_meta.dtypes)
    except Exception as e:
        print(f"⚠️ Erro ao ler metadados da tabela {table_name}: {e}")
        return []

    print(f"🔎 Analisando {len(colunas)} colunas em '{table_name}'...")

    for col in colunas:
        col_lower = col.lower()
        col_type = dtypes[col]
        
        # --- REGRA 1: Validação de MESES (1 a 12) ---
        # Procura por 'mes' no nome (ex: mes_ref, cd_mes, mes_pagamento)
        if "mes" in col_lower and col_type in ['int', 'bigint', 'smallint']:
            regras.append({
                "name": f"auto_validity_mes_{col}",
                "col": col,
                "category": "Validity",
                "fail_condition": f"{col} > 12 OR {col} < 1",
                "threshold": 1.0
            })

        # --- REGRA 2: Validação de TRIMESTRES (1 a 4) ---
        elif "trimestre" in col_lower and col_type in ['int', 'bigint', 'smallint']:
            regras.append({
                "name": f"auto_validity_trim_{col}",
                "col": col,
                "category": "Validity",
                "fail_condition": f"{col} > 4 OR {col} < 1",
                "threshold": 1.0
            })

        # --- REGRA 3: Validação de SEMESTRES (1 a 2) ---
        elif "semestre" in col_lower and col_type in ['int', 'bigint', 'smallint']:
            regras.append({
                "name": f"auto_validity_sem_{col}",
                "col": col,
                "category": "Validity",
                "fail_condition": f"{col} > 2 OR {col} < 1",
                "threshold": 1.0
            })
            
        # --- REGRA 4: Validação Genérica de NULOS (Completeness) ---
        # Aplica para IDs ou Chaves Primárias (se tiver 'id_' ou 'cod_' no nome)
        if col_lower.startswith("id_") or col_lower.startswith("cod_") or col_lower == "id":
            regras.append({
                "name": f"auto_completeness_{col}",
                "col": col,
                "category": "Completeness",
                "fail_condition": f"{col} IS NULL",
                "threshold": 1.0
            })

        # --- REGRA 5: Valores Negativos (Para colunas de 'valor' ou 'preco') ---
        if ("valor" in col_lower or "preco" in col_lower) and col_type in ['double', 'float', 'decimal']:
             regras.append({
                "name": f"auto_validity_positive_{col}",
                "col": col,
                "category": "Validity",
                "fail_condition": f"{col} < 0",
                "threshold": 0.99
            })

    return regras

# ==============================================================================
# 4. A ENGINE DE EXECUÇÃO
# ==============================================================================
def executar_dq(lista_tabelas):
    resultados = []
    data_execucao = datetime.now().date()
    
    # LOOP PRINCIPAL
    for tabela in lista_tabelas:
        # 1. Gera as regras dinamicamente para essa tabela
        regras_tabela = gerar_regras_automaticas(tabela)
        
        if not regras_tabela:
            print(f"   -> Nenhuma regra aplicável encontrada para {tabela}.")
            continue
            
        print(f"   -> Aplicando {len(regras_tabela)} regras em {tabela}...")
        
        try:
            df = spark.table(tabela)
            total = df.count()
            
            if total == 0: continue

            for r in regras_tabela:
                # O Pulo do Gato: F.expr permite SQL dinâmico
                falhas = df.filter(F.expr(r['fail_condition'])).count()
                score = 1.0 - (falhas / total)
                status = "PASS" if score >= r['threshold'] else "FAIL"
                
                resultados.append((
                    data_execucao, tabela, r['col'], r['category'],
                    r['name'], total, falhas, float(score), status, r['fail_condition']
                ))
                
        except Exception as e:
            print(f"❌ Erro executando regras em {tabela}: {e}")

    # Retorna DataFrame final
    if resultados:
        return spark.createDataFrame(resultados, schema=dq_output_schema)
    else:
        return spark.createDataFrame([], schema=dq_output_schema)

# ==============================================================================
# 5. RODAR O PROCESSO
# ==============================================================================

print("🚀 Iniciando Pipeline de Qualidade de Dados...")

# A mágica acontece aqui:
df_final_quality = executar_dq(lista_tabelas)

print("\n📊 RESULTADOS:")
display(df_final_quality)

# Salvar (Descomente para salvar)
# df_final_quality.write.mode("append").saveAsTable("default.f_data_quality")