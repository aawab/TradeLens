import pandas as pd
import numpy as np

from sklearn import manifold
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.metrics import mean_squared_error
from yellowbrick.cluster import KElbowVisualizer

# Read the files into two dataframes.
df1 = pd.read_csv('./PCPData.csv')
df2 = pd.read_csv('./world-data-2023.csv')

# Merge the two dataframes, using _ID column as key
df3 = pd.merge(df1, df2, on = 'Country')
df3.set_index('Country', inplace = True)

# Write it to a new CSV file
df3.to_csv('./final.csv')