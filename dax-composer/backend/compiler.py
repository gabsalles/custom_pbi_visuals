from bs4 import BeautifulSoup

class DAXCompiler:
    def __init__(self, svg_content: str):
        self.soup = BeautifulSoup(svg_content, 'xml')
        self.dax_vars_declaration = []
        self.dax_vars_calculation = []
        self.css_styles = []

    def clean_id(self, id_str):
        if not id_str: return "element_unknown"
        return id_str.replace("-", "_").replace(" ", "_").strip()

    def add_variable_mapping(self, element_id, measure_da_interface):
        clean_id = self.clean_id(element_id)
        var_name = f"_Input_{clean_id}"
        measure = measure_da_interface if measure_da_interface and measure_da_interface.strip() else "BLANK()"
        declaration = f"VAR {var_name} = {measure}"
        if declaration not in self.dax_vars_declaration:
            self.dax_vars_declaration.append(declaration)
        return var_name

    def create_clip_rect(self, element_id):
        """Cria uma máscara para evitar distorção em barras arredondadas"""
        element = self.soup.find(id=element_id)
        if not element: return None
        
        clean_id = self.clean_id(element_id)
        clip_id = f"cp_{clean_id}"
        mask_rect_id = f"mr_{clean_id}"
        
        x = element.get('x', '0')
        y = element.get('y', '0')
        w = element.get('width', '100%')
        h = element.get('height', '100%')
        
        defs = self.soup.find('defs')
        if not defs:
            defs = self.soup.new_tag('defs')
            if self.soup.svg: self.soup.svg.insert(0, defs)
            
        clip_tag = self.soup.new_tag('clipPath', id=clip_id)
        rect_tag = self.soup.new_tag('rect', id=mask_rect_id, x=x, y=y, width=w, height=h)
        
        clip_tag.append(rect_tag)
        defs.append(clip_tag)
        element['clip-path'] = f"url(#{clip_id})"
        
        return mask_rect_id

    def apply_bar_chart_logic(self, element_id, input_var, max_value, direction):
        element = self.soup.find(id=element_id)
        if not element: return

        clean_id = self.clean_id(element_id)
        try:
            orig_w = float(element.get('width', 0))
            orig_h = float(element.get('height', 0))
            orig_x = float(element.get('x', 0))
            orig_y = float(element.get('y', 0))
        except: return 

        calc_var_name = f"_Calc_Pixel_{clean_id}"
        dim_base = orig_h if direction in ['up', 'down'] else orig_w

        calc_logic = (
            f"VAR {calc_var_name} = \n"
            f"    VAR _val = {input_var}\n"
            f"    VAR _max = {max_value}\n"
            f"    RETURN IF(_max > 0, INT(DIVIDE(_val, _max) * {dim_base}), 0)"
        )
        self.dax_vars_calculation.append(calc_logic)

        if direction == 'right': element['width'] = f"' & {calc_var_name} & '"
        elif direction == 'down': element['height'] = f"' & {calc_var_name} & '"
        elif direction == 'up': 
            element['height'] = f"' & {calc_var_name} & '"
            element['y'] = f"' & ({orig_y} + {orig_h} - {calc_var_name}) & '"
        elif direction == 'left': 
            element['width'] = f"' & {calc_var_name} & '"
            element['x'] = f"' & ({orig_x} + {orig_w} - {calc_var_name}) & '"

    def apply_static_transform(self, element_id, data):
        """Aplica TODAS as modificações estáticas (Granularidade Total)"""
        element = self.soup.find(id=element_id)
        if not element: return

        # 1. Transformações Geométricas
        transforms = []
        if float(data.get('x', 0)) != 0 or float(data.get('y', 0)) != 0:
            transforms.append(f"translate({data.get('x', 0)}px, {data.get('y', 0)}px)")
        if float(data.get('scale', 1)) != 1:
            transforms.append(f"scale({data.get('scale', 1)})")
        if float(data.get('rotate', 0)) != 0:
            transforms.append(f"rotate({data.get('rotate', 0)}deg)")
        if float(data.get('skewX', 0)) != 0:
            transforms.append(f"skewX({data.get('skewX', 0)}deg)")
        if float(data.get('skewY', 0)) != 0:
            transforms.append(f"skewY({data.get('skewY', 0)}deg)")

        style_parts = []
        if data.get('transform_origin'): style_parts.append(f"transform-origin: {data['transform_origin']}")
        
        # 2. Filtros e Blend Modes
        if data.get('filter'): style_parts.append(f"filter: {data['filter']}")
        if data.get('mix_blend_mode'): style_parts.append(f"mix-blend-mode: {data['mix_blend_mode']}")
        if data.get('cursor'): style_parts.append(f"cursor: {data['cursor']}")

        # 3. SVG Props (Stroke/Text)
        if data.get('stroke_linecap'): style_parts.append(f"stroke-linecap: {data['stroke_linecap']}")
        if data.get('stroke_linejoin'): style_parts.append(f"stroke-linejoin: {data['stroke_linejoin']}")
        if data.get('text_anchor'): style_parts.append(f"text-anchor: {data['text_anchor']}")
        if data.get('font_weight'): style_parts.append(f"font-weight: {data['font_weight']}")
        
        if float(data.get('opacity', 1)) != 1:
            style_parts.append(f"opacity: {data['opacity']}")

        existing_style = element.get('style', '')
        if transforms:
            style_parts.append(f"transform: {' '.join(transforms)}")
            style_parts.append("transform-box: fill-box")

        new_style = f"{existing_style}; {'; '.join(style_parts)}"
        element['style'] = new_style

    def apply_hover_effects(self, element_id, hover_data):
        if not hover_data: return
        
        base_style = f"#{element_id} {{ transition: all 0.3s ease; }}"
        if base_style not in self.css_styles: self.css_styles.append(base_style)
        
        props = []
        if hover_data.get('fill'): props.append(f"fill: {hover_data['fill']} !important;")
        if hover_data.get('opacity'): props.append(f"opacity: {hover_data['opacity']};")
        
        transforms = []
        if hover_data.get('scale'): transforms.append(f"scale({hover_data['scale']})")
        if hover_data.get('rotate'): transforms.append(f"rotate({hover_data['rotate']}deg)")
        
        if transforms:
            props.append(f"transform: {' '.join(transforms)};")
            props.append("transform-box: fill-box; transform-origin: center;")

        if props:
            self.css_styles.append(f"#{element_id}:hover {{ {' '.join(props)} }}")

    def apply_custom_animation(self, element_id, anim_data):
        clean_id = self.clean_id(element_id)
        anim_name = f"anim_{clean_id}"
        
        def get_trans(d):
            t = []
            if d.get('x') and float(d.get('x'))!=0: t.append(f"translateX({d['x']}px)")
            if d.get('y') and float(d.get('y'))!=0: t.append(f"translateY({d['y']}px)")
            if d.get('scale'): t.append(f"scale({d['scale']})")
            if d.get('rotate'): t.append(f"rotate({d['rotate']}deg)")
            return " ".join(t) if t else "none"

        start, end = anim_data.get('start', {}), anim_data.get('end', {})
        
        keyframes = f"""
        @keyframes {anim_name} {{
            0% {{ transform: {get_trans(start)}; opacity: {start.get('opacity', 1)}; }}
            100% {{ transform: {get_trans(end)}; opacity: {end.get('opacity', 1)}; }}
        }}
        """
        
        iter_count = str(anim_data.get('iteration', '1'))
        if iter_count != 'infinite': iter_count = str(iter_count)

        css_class = f"""
        .{anim_name}_cls {{
            animation-name: {anim_name};
            animation-duration: {anim_data.get('duration', '1s')};
            animation-delay: {anim_data.get('delay', '0s')};
            animation-timing-function: {anim_data.get('timing', 'ease')};
            animation-iteration-count: {iter_count};
            animation-direction: {anim_data.get('direction', 'normal')};
            animation-fill-mode: {anim_data.get('fill_mode', 'forwards')};
            transform-box: fill-box;
            transform-origin: center;
        }}
        """
        
        self.css_styles.append(keyframes)
        self.css_styles.append(css_class)
        
        element = self.soup.find(id=element_id)
        if element:
            curr = element.get('class', '')
            element['class'] = f"{curr} {anim_name}_cls".strip()

    def generate_dax(self):
        style_block = ""
        if self.css_styles:
            style_block = f"<style>\n{chr(10).join(self.css_styles)}\n</style>"

        if self.soup.svg and style_block:
            style_tag = self.soup.new_tag("style")
            style_tag.string = "\n".join(self.css_styles)
            self.soup.svg.insert(0, style_tag)

        svg_str = str(self.soup).replace('"', "'")

        return f"""
Visual HTML = 
-----------------------------------------------------------
-- 1. MAPEAMENTO DE DADOS
-----------------------------------------------------------
{chr(10).join(self.dax_vars_declaration)}

-----------------------------------------------------------
-- 2. CÁLCULOS AUTOMÁTICOS
-----------------------------------------------------------
{chr(10).join(self.dax_vars_calculation)}

-----------------------------------------------------------
-- 3. RENDERIZAÇÃO
-----------------------------------------------------------
VAR _svg_output = "
{svg_str}
"
RETURN _svg_output
"""