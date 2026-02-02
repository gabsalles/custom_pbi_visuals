# backend/animations.py

def get_animation_css(anim_type, duration="1s"):
    """Retorna o bloco CSS baseado no tipo escolhido."""
    
    library = {
        "fade_in_up": f"""
            animation: fadeInUp {duration} ease-out forwards;
            opacity: 0;
            @keyframes fadeInUp {{
                from {{ opacity: 0; transform: translate(0, 20px); }}
                to {{ opacity: 1; transform: translate(0, 0); }}
            }}
        """,
        "pulse_alert": f"""
            animation: pulse 2s infinite;
            transform-origin: center;
            @keyframes pulse {{
                0% {{ transform: scale(1); }}
                50% {{ transform: scale(1.05); }}
                100% {{ transform: scale(1); }}
            }}
        """,
        "spin": f"""
            animation: spin {duration} linear infinite;
            transform-box: fill-box;
            transform-origin: center;
            @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
        """
    }
    return library.get(anim_type, "")