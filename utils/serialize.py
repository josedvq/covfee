#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: serialize.py
# Created Date: Wednesday, September 16th 2020, 9:39:09 pm
# Author: Chirag Raman
#
# Copyright (c) 2020 Chirag Raman
###

from pathlib import Path
from typing import List, Any


CSV_HEADER = ["linux-time", "frame", "x", "y", "occluded", "last-action"]


def write_to_csv(chunk_data: List[List[Any]], out_file: Path,
                 convert_time_to_frame: bool = False) -> None:
    """ Writes a chunk to a csv file at the specified path """
    if not out_file.is_file():
        # File does not exist, write header
        with open(out_file, "w") as f:
            f.write(",".join(CSV_HEADER)+"\n")

    last_action = None
    with open(out_file, "a") as f:
        # Write data in append mode
        for entry in chunk_data:
            # Handle frame number
            frame = entry[1]
            if convert_time_to_frame:
                # TODO: Get LTC Frame to avoid rounding errors
                frame = frame
            # Handle payload
            payload = entry[-1]
            if len(payload) == 3:
                payload_str = ",".join(map(str, payload))
            elif len(payload) == 1:
                last_action = payload[0]
                payload_str = "None,None,None"
            else:
                raise ValueError("Unrecognized payload length; accepts 3 or 1")
            f.write("{},{},{},{}\n".format(
                str(entry[0]), frame, payload_str, last_action)
            )


def main() -> None:
    """ Usage example for the csv writer """
    out_file = Path("csv_example.csv")
    chunk_data = [[1600004663282, 0, ['play']],
                  [1600004664438, 0.438416, [0.5264663805436338,
                                             0.27735368956743, False]]]
    write_to_csv(chunk_data, out_file)


if __name__ == "__main__":
    main()
