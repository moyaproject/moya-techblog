from setuptools import setuptools

VERSION = "0.1.0"

setup(
    name='techblog',
    version=VERSION,
    description="Blog for Coders and Photographers",
    zip_safe=False,
    license="MIT",
    author="Will McGugan",
    author_email="willmcgugan@gmail.com",
    url="https://github.com/moyaproject/moya-techblog",

    entry_points={
        "console_scripts": [
            'techblog = techblog:main'
        ]

    }

)