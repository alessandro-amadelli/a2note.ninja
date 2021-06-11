import matplotlib.pyplot as plt
from io import BytesIO
import base64

import plotly.graph_objects as go

def old_make_donut(title=None, values=[1,1], labels=None, colors=None, center_text=None):
    """
    Generates a donut plot and return it as an img
    """
    # Removing toolbar
    plt.rcParams['toolbar'] = 'None'

    plt.title(title)

    # Create a circle at the center of the plot (to make the plot a donut)
    my_circle = plt.Circle( (0,0), 0.8, color="white")

    # Making the pie plot
    patches, text = plt.pie(values, colors=colors, wedgeprops={'linewidth': 5, "edgecolor": "white"})
    plt.legend(patches, labels, loc=(-0.1,0), fontsize="xx-large", shadow=True)
    plt.tight_layout()

    if center_text:
        #Center text
        plt.text(0, 0, center_text, fontsize=40, horizontalalignment='center', verticalalignment='center')

    p = plt.gcf()
    p.gca().add_artist(my_circle)

    # Show the graph
    #plt.show()

    fig = p

    plt.close('all')

    tmpF = BytesIO()
    fig.savefig(tmpF, format='png')
    encoded = base64.b64encode(tmpF.getvalue())
    encoded = str(encoded)[2:-1]

    retStr = f"<img src=\"data:image/png;base64,{encoded}\" class=\"img-fluid rounded plot-img\">"

    return retStr


def make_donut(title=None, values=[1,1], labels=None, colors=None, center_text=None):

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

    fig = go.Figure(go.Bar(x=labels, y=values, marker_color=colors))

    graph = fig.to_html(full_html=False, config={"displayModeBar": False})

    return graph


def old_make_bar(title=None, values=[1,1], labels=None, colors=None):
        """
        Generates a bar plot and return it as an img
        """

        x_pos = [x + (x-1) -1  for x in range(1,8)]

        # y_pos = [i for i in range(max(values)+1)]
        y_pos = [0, max(values)//2, max(values)]

        # Removing toolbar
        plt.rcParams['toolbar'] = 'None'

        plt.title(title)

        # Creating bars
        plt.bar(x_pos, values, color=colors)

        #Positioning labels
        if labels:
            plt.xticks(x_pos, labels)

        plt.yticks(y_pos, y_pos)
        plt.tight_layout()
        plt.tick_params(length=0, width=0)

        p = plt.gcf()

        # Show the graph
        #plt.show()

        fig = p

        plt.close('all')

        tmpF = BytesIO()
        fig.savefig(tmpF, format='png')
        encoded = base64.b64encode(tmpF.getvalue())
        encoded = str(encoded)[2:-1]

        retStr = f"<img src=\"data:image/png;base64,{encoded}\" class=\"img-fluid rounded plot-img\">"

        return retStr
