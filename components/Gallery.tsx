import * as React from "react";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import ImageViewer from "./ImageViewer";

const {
  Value, event, block, debug, cond, set, add, diff,
} = Animated;

export interface Image {
  uri: string;
  width: number;
  height: number;
}

interface GalleryProps {
  images: Image[]
}

export default class Gallery extends React.PureComponent<GalleryProps> {
  isOutBoundX = new Value(0);

  scrollRef = React.createRef();

  dragX = new Value(0);

  dragY = new Value(0);

  panState = new Value(State.UNDETERMINED);

  _onPanEvent = event([
    {
      nativeEvent: {
        translationX: this.dragX,
        translationY: this.dragY,
        state: this.panState,
      },
    },
  ]);

  render() {
    const { scrollRef, isOutBoundX } = this;
    const { images: [source] } = this.props;
    const translateX = new Value(0);
    return (
      <PanGestureHandler
        ref={this.scrollRef}
        avgTouches
        onGestureEvent={this._onPanEvent}
        onHandlerStateChange={this._onPanEvent}
      >
        <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
          <Animated.Code>
            {
              () => block([
                debug("isOutBoundX", isOutBoundX),
                debug("x", this.dragX),
                cond(isOutBoundX, set(translateX, add(translateX, diff(this.dragX)))),
              ])
            }
          </Animated.Code>
          <ImageViewer {...{ source, isOutBoundX, scrollRef }} />
        </Animated.View>
      </PanGestureHandler>
    );
  }
}
