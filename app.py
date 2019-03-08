from flask import Flask
from flask import render_template

app = Flask(__name__)

app.config['TESTING'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True


@app.route('/')
def cchs_chart():
    return render_template('cchs_nutrition-en.html', title='CCHS Nutrition')


@app.route('/geo')
def geo_chart():
    return render_template('cchs_nutrition_geo-en.html', title='CCHS Nutrition - Geography')


@app.route('/bar')
def bar_chart():
    return render_template('cchs_nutrition_bar-en.html', title='CCHS Nutrition - Bar')


if __name__ == '__main__':
    app.run()
