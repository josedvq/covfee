This task requires pre-computation of the optical flow using the script in utils/flow.py. The final video fed to Covfee should be twice the original horizontal resolution, with an optical flow video on the right hand side, matching frame by frame with the original video on the left.

To prepare an mp4 video for continuous keypoint annotation:

1. Denoise the video if necessary. Noise often makes optical flow unreliable. A command such as the following could be helpful:

```
ffmpeg -i sample.mp4 -vf hqdn3d=luma_tmp=20 -vcodec libx264 -tune film hqdn.mp4 -y
```

2. Compute optical flow on the denoised video:
```
python3 utils/flow.py -v path/to/denoised/video.mp4 -f path/to/flow/output.mp4 -w 1920
```

`w` indicates the width of the output. Set it to the width of the denoised video.

3. Horizontally stack the two videos:
```
ffmpeg -i pilot_denoised.mp4 -i pilot_flow.mp4  -filter_complex hstack pilot_combined
```