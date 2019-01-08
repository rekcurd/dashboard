import pathlib

import numpy as np

from sklearn.dummy import DummyClassifier
from sklearn.externals import joblib


def main():
    positive_clf = DummyClassifier(strategy='constant', constant=1)
    negative_clf = DummyClassifier(strategy='constant', constant=0)
    model_dir = pathlib.Path(__file__).parent.joinpath('test-models')
    model_dir.mkdir(exist_ok=True)
    # The input doesn't matter
    X = np.random.random(4).reshape(2, 2)
    y = [0, 1]
    positive_clf.fit(X, y)
    negative_clf.fit(X, y)
    joblib.dump(positive_clf, model_dir.joinpath(f'positive.pkl'))
    joblib.dump(negative_clf, model_dir.joinpath(f'negative.pkl'))


if __name__ == "__main__":
    main()
