from flask import Flask
from flask import render_template

app = Flask(__name__)

app.config['TESTING'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True


@app.route('/')
def cchs_chart():
    return render_template('cchs_nutrition-en.html', title='CCHS Nutrition')


if __name__ == '__main__':
    app.run()
