# React app to visualize pressure sensors data

This app is made to be used with Corentin Porcon's experimental arena. This will redraw the 96 sensors visualization of the arena and allow for the selection of specific sensors to plot the pressure timeserie. 
Multiple plots can be drawn at the same time. The pressure axis can be parametrizes as well as the flying time window.

<img width="1833" height="864" alt="image" src="https://github.com/user-attachments/assets/ffc533ad-4b7f-4ac1-a4fd-75de1e0b5c93" />


# Requierments

The csv file must be preprocess to apply a 2nd order Butterworth with lowcut frequency of 0.3Hz and highcut frequency of 30Hz. Other filters are of course compatible too, but this is the one we usually use ourselves.

# Home screen

At the launch of the app, a placeholder timeserie is displayed. It will be replaced by real data as soon as your csv is completely loaded.

# WIP

The video of the experiment will soon be incrusted being the sensor map to give insight into the position of the fish at each time.
