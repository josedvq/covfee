import cv2
import numpy as np

def resize_and_gray(frame, res):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    if res:
        scale = res[0] / frame.shape[1]
        # assert scale == res[1] / \
        #     frame.shape[0], f'{frame.shape[0]/res[0]:f} != {frame.shape[1]/res[1]:f}'
        gray = cv2.resize(gray, (res[0], res[1]),
                          interpolation=cv2.INTER_LANCZOS4)
        # gray = cv2.resize(gray, None, fx=scale, fy=scale)
    return gray

def optical_flow_cart(frame1, frame2, res=None):
    gray1 = resize_and_gray(frame1, res)
    gray2 = resize_and_gray(frame2, res)

    # print((gray1.shape, gray2.shape))
    # Calculate dense optical flow by Farneback method
    return cv2.calcOpticalFlowFarneback(gray1, gray2, None, pyr_scale=0.5, levels=3, winsize=15, iterations=3, poly_n=5, poly_sigma=1.2, flags=0)

def optical_flow_polar(frame1, frame2, res=None):
    flow = optical_flow_cart(frame1, frame2, res)
    # print(flow.shape)

    # Compute the magnitude and angle of the 2D vectors
    return cv2.cartToPolar(flow[...,0], flow[...,1])

def optical_flow_mask(frame1, frame2):
    magnitude, angle = optical_flow_polar(frame1, frame2)

    # Set image hue according to the optical flow direction
    mask = np.empty((frame1.shape[0], frame1.shape[1], 3), dtype=np.uint8)
    mask[:, :, 1] = 255
    mask[:, :, 0] = angle * 180 / np.pi / 2
    # Set image value according to the optical flow magnitude (normalized)
    mask[:, :, 2] = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    # Convert HSV to RGB (BGR) color representation
    rgb = cv2.cvtColor(mask, cv2.COLOR_HSV2BGR)

    return rgb

def pixelwise_movement(frame1, frame2, max_value=None, res=None):
    # print((frame1.shape, frame2.shape, res))
    magnitude, angle = optical_flow_polar(frame1, frame2, res)
    # pm = np.linalg.norm(of, axis=2)
    if res is not None:
        of = np.empty((res[1], res[0]), dtype=np.uint8)
    else:
        of = np.empty((frame1.shape[0], frame1.shape[1]), dtype=np.uint8)

    if max_value is not None:
        magnitude[magnitude > max_value] = max_value
        of[:,:] = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
        return of
    else:
        return magnitude
