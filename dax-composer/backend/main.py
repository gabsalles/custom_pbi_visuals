from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from compiler import DAXCompiler
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS COMPLETOS ---

class StaticTransform(BaseModel):
    x: str = "0"
    y: str = "0"
    scale: str = "1"
    rotate: str = "0"
    skewX: str = "0"
    skewY: str = "0"
    opacity: str = "1"
    transform_origin: Optional[str] = "center"
    
    # CSS Extras (Filtros e Estilos)
    filter: Optional[str] = None
    mix_blend_mode: Optional[str] = None
    cursor: Optional[str] = None
    stroke_linecap: Optional[str] = None
    stroke_linejoin: Optional[str] = None
    text_anchor: Optional[str] = None
    font_weight: Optional[str] = None

class HoverConfig(BaseModel):
    enabled: bool = False
    fill: Optional[str] = None
    opacity: Optional[str] = None
    scale: Optional[str] = None
    rotate: Optional[str] = None

class KeyframeState(BaseModel):
    x: Optional[str] = "0"
    y: Optional[str] = "0"
    scale: Optional[str] = "1"
    rotate: Optional[str] = "0"
    opacity: Optional[str] = "1"

class CustomAnimConfig(BaseModel):
    enabled: bool = False
    duration: str = "1s"
    delay: str = "0s"
    timing: str = "ease"
    iteration: str = "1"
    direction: str = "normal"
    fill_mode: str = "forwards"
    start: Optional[KeyframeState] = None
    end: Optional[KeyframeState] = None

class Binding(BaseModel):
    element_id: str
    measure: Optional[str] = ''
    property_type: Optional[str] = 'none' # 'bar', 'clip_bar', 'fill', 'text', 'none'
    
    direction: Optional[str] = 'right'
    max_value: Optional[str] = '100'

    static: Optional[StaticTransform] = None
    hover: Optional[HoverConfig] = None
    custom_anim: Optional[CustomAnimConfig] = None

class RequestBody(BaseModel):
    svg_code: str
    bindings: List[Binding]

# --- ENDPOINT ---

@app.post("/compile")
def compile_dax(data: RequestBody):
    compiler = DAXCompiler(data.svg_code)
    
    for item in data.bindings:
        # 1. Variável (Cria VAR _Input...)
        var_name = None
        if item.measure:
            var_name = compiler.add_variable_mapping(item.element_id, item.measure)
        
        # 2. Ajustes Estáticos (Sempre aplica no original)
        if item.static:
            compiler.apply_static_transform(item.element_id, item.static.dict())

        # 3. Lógica de Negócio (Barra / Máscara)
        target_id = item.element_id
        
        if item.property_type == 'clip_bar':
            # Se for Máscara, cria o Rect invisível e aplica a lógica de barra NELE
            mask_id = compiler.create_clip_rect(item.element_id)
            if mask_id: target_id = mask_id
            
            if var_name:
                compiler.apply_bar_chart_logic(target_id, var_name, item.max_value, item.direction)
        
        elif item.property_type == 'bar' and var_name:
            # Se for Barra normal, aplica no elemento direto (com distorção)
            compiler.apply_bar_chart_logic(target_id, var_name, item.max_value, item.direction)
        
        # 4. Hover (No original)
        if item.hover and item.hover.enabled:
            compiler.apply_hover_effects(item.element_id, item.hover.dict(exclude_none=True))
        
        # 5. Animação Custom (No original)
        if item.custom_anim and item.custom_anim.enabled:
            compiler.apply_custom_animation(item.element_id, item.custom_anim.dict())
            
    return {"dax": compiler.generate_dax()}