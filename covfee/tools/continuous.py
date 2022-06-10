import numpy as np
import pandas as pd

def calc_skipped_frames(df, media_time_column = 'media_time'):
    one_fractions = []

    media_time = df['media_time'].to_numpy()
    try:
        first_nonzero_idx = np.where(media_time != 0)[0][0]
    except:
        raise Exception('Media time all zeroes. Something is very wrong with this dataframe.')

    valid_data = media_time[first_nonzero_idx:]
    zero_idxs = np.where(valid_data == 0)[0]
    if len(zero_idxs) <= 1:
        first_zero_idx = len(zero_idxs) - 1
    else:
        first_zero_idx = zero_idxs[1]
    valid_data = valid_data[:first_zero_idx-1]
    return np.sum(valid_data == 0) / len(valid_data)

def interpolate(df: pd.DataFrame, data_columns=['data0'], media_time_column = 'media_time', **interpolation_args):
    df = df.copy()

    skipped_idxs = df[media_time_column] == 0
    df.loc[skipped_idxs, data_columns] = np.nan
    df.interpolate(**interpolation_args)

