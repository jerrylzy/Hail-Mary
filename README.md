# WebGL Animation: Hail Mary
This is a modified (funnier) version of the unbelievable last second Hail Mary
by Aaron Rodgers at Detroit.

The packers were down by 20 at the beginning of the 3rd quarter,
but Aaron Rodgers led his team, with his miraculous Hail Mary,
make the biggest comeback in the history of this rivalry.

## Animation website:
https://jerrylzy.github.io/hail-mary/

## My Hierachy of Objects:

### Pyramid:

      self-created flat-shaded polygon
      - 6x triangle

### Arena
      - Ground (Textured)
        -- Detroit logo (Textured)
      - Down markers
        -- Sphere (Textured)
        -- Cube
        -- Pyramid (Textured)
      - Goal Post
        -- Support Column (Textured)
        -- Horizontal Rod
        -- 2x Vertical Rod
      - Soil
        -- Cube

### Football
      - Sphere (Textured)
        -- Bump Mapped
      - Lace
        -- Pyramid (Textured)

### Player
      - Head
        -- Eye
      - Arm
        -- Lower Arm
        -- Upper Arm
        -- (Football)
      - Body (Textured)
      - Leg
        -- Lower Leg
        -- Upper Leg

There are multiple types of players with different body size and initial state.
I also made special versions of quarterback and refs.

Every player's speed and position is real time.
The ball's trajectory is parabolic.
My program will automatically correct degrees of rotation.
FPS values are calculated using exponential smoothing technique.

Since the scenes are complex and, gt750m gave me a little above 30 fps.
However, I found it to be very smooth on Safari.

### Common files:

      webgl-utils.js: standard utilities from google to set up a webgl context
      MV.js: our matrix/vector package. Documentation on website
      initShaders.js: functions to initialize shaders in the html file
      initShaders2.js: functions to initialize shaders that are in separate files

### Animation file location

      WebGL/WebGL_Template/animation.js


