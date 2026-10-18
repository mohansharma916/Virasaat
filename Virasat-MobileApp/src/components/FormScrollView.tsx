import { forwardRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

type FormScrollViewProps = ScrollViewProps & {
  // Space kept between the focused field and the keyboard. The default clears
  // a sticky ActionBar, which rides on top of the keyboard.
  bottomOffset?: number;
};

// Scroll view for screens with text fields: it scrolls the focused field into
// view above the keyboard on both platforms (Android draws edge-to-edge, so
// the window never resizes for the keyboard on its own).
export const FormScrollView = forwardRef<KeyboardAwareScrollViewRef, FormScrollViewProps>(
  function FormScrollView({ bottomOffset = 112, keyboardShouldPersistTaps = 'handled', ...props }, ref) {
    return (
      <KeyboardAwareScrollView
        ref={ref}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      />
    );
  },
);
