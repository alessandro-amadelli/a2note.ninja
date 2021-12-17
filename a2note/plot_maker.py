import plotly.graph_objects as go
from plotly.io import to_image
import base64

def make_donut(title=None, values=[1,1], labels=None, colors=None, center_text=None):
    """
    Generates a donut chart
    """
    # Use 'hole' to create a donut-like pie chart
    fig = go.Figure(data=[go.Pie(labels=labels, values=values, hole=.90, marker_colors=colors)])

    if center_text:
        fig.update_layout(
        annotations=[{
        "text": center_text,
        "x": 0.5,
        "y": 0.5,
        "font_size": 30,
        "showarrow": False
        }])

    fig.update_layout(margin=dict(l=35, r=35, b=35, t=35),
    legend=dict(font=dict(size=20)),
    font=dict(size=20)
    )

    # graph = fig.to_html(full_html=False, config={"displayModeBar": False})
    img_bytes = fig.to_image(format="png")

    return str(base64.b64encode(img_bytes))[2:-1]

def make_bar(title=None, values=[1,1], labels=None, colors=None):
    """
    Generates a bar chart
    """

    fig = go.Figure(go.Bar(x=labels, y=values, marker_color=colors, width=[0.4 for i in range(len(values))]))

    fig.update_layout(margin=dict(
    l=10,
    r=10,
    b=10,
    t=10
    ))

    img_bytes = fig.to_image(format="png")

    return str(base64.b64encode(img_bytes))[2:-1]
