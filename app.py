from flask import Flask
from flask import render_template

app = Flask(__name__)

app.config['TESTING'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True


@app.route('/')
def cchs_chart():
    return render_template('index.html', title='CCHS Nutrition')


@app.route('/geo')
def geo_chart():
    return render_template('cchs_nutrition_geo-en.html', title='CCHS Nutrition - Geography')


@app.route('/geo-2015')
def geo_chart_2015():
    return render_template('cchs_nutrition_geo_2015-en.html', title='CCHS Nutrition - Geography (2015)')


@app.route('/bar')
def bar_chart():
    return render_template('cchs_nutrition_bar-en.html', title='CCHS Nutrition - Bar')


@app.route('/distribution')
def distribution_chart():
    return render_template('cchs_nutrition_distribution-en.html', title='CCHS Nutrition - Distribution')


@app.route('/distribution-2015')
def distribution_chart_2015():
    return render_template('cchs_nutrition_distribution_2015-en.html', title='CCHS Nutrition - Distribution (2015)')


@app.route('/table')
def distribution_chart_2015():
    return render_template('cchs_nutrition_table-en.html', title='CCHS Nutrition - Table (2015)')


@app.route('/distribution-api')
def distribution_chart_api():
    return render_template('cchs_nutrition_distribution_api-en.html',
                           title='CCHS Nutrition - Distribution (API Backend)')


if __name__ == '__main__':
    app.run()
