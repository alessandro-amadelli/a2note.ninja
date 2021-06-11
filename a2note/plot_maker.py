import plotly.graph_objects as go


def make_donut(title=None, values=[1,1], labels=None, colors=None, center_text=None):
    """
    Generates a donut chart
    """
    # Use `hole` to create a donut-like pie chart
    fig = go.Figure(data=[go.Pie(labels=labels, values=values, hole=.8, marker_colors=colors)])

    if center_text:
        fig.update_layout(
        annotations=[{
        "text": center_text,
        "x": 0.5,
        "y": 0.5,
        "font_size": 30,
        "showarrow": False
        }]
        )

    # fig.write_html('first_figure.html', auto_open=True)
    graph = fig.to_html(full_html=False, config={"displayModeBar": False})

    return graph

def make_bar(title=None, values=[1,1], labels=None, colors=None):
    """
    Generates a bar chart
    """

    fig = go.Figure(go.Bar(x=labels, y=values, marker_color=colors))

    graph = fig.to_html(full_html=False, config={"displayModeBar": False})

    return graph
