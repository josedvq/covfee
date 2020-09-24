import cv2
import numpy as np
import argparse
import logging

from tqdm import tqdm, trange

from covfee.utils.continuous_keypoint.of_utils import pixelwise_movement, optical_flow_mask

def compute_flow(video_path: str, flow_path: str, width: int):
    cap = cv2.VideoCapture(video_path)
    num_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    video_res = (
        int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))

    flow_res = (width, int(width * video_res[1] / video_res[0]))

    fourcc = cv2.VideoWriter_fourcc(*'H264')
    out = cv2.VideoWriter(flow_path, fourcc, frame_rate, flow_res, 0)

    _, prev_frame = cap.read()
    for i in trange(num_frames-1):
        _, frame = cap.read()
        of = pixelwise_movement(prev_frame, frame, max_value=0.4, res=flow_res)
        out.write(of)
        prev_frame = frame
    out.write(of)  # repeat the last frame to have the same number

    cap.release()
    out.release()
    cv2.destroyAllWindows()

def main(args):
    compute_flow(**args)
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Computes the dense optical flow for a video, and stores it into another video.')

    parser.add_argument('-v',
                        '--video',
                        required=True,
                        help="video file")
    parser.add_argument('-f',
                        '--flow',
                        required=True,
                        help="output flow file")
    parser.add_argument('-w',
                        '--width',
                        type=int,
                        default=320,
                        help="width of the resulting flow video")
    parser.add_argument('-d',
                        '--debug',
                        help="Print lots of debugging statements",
                        action="store_const",
                        dest="loglevel",
                        const=logging.DEBUG,
                        default=logging.WARNING)

    args = parser.parse_args()
    main(args)
