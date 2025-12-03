// Minimal no-op shim to replace framer-motion
import React from 'react';

// List of framer-motion specific props to filter out
const motionProps = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap',
  'whileFocus', 'whileDrag', 'whileInView', 'drag', 'dragConstraints', 'dragElastic',
  'dragMomentum', 'onDragStart', 'onDragEnd', 'onDrag', 'layout', 'layoutId'
]);

export const motion: any = new Proxy({}, {
  get: (target, tag: string) => {
    return ({ children, ...props }: any) => {
      // Filter out motion-specific props
      const cleanProps: any = {};
      Object.keys(props).forEach(key => {
        if (!motionProps.has(key)) {
          cleanProps[key] = props[key];
        }
      });
      return React.createElement(tag, cleanProps, children);
    };
  }
});

export const AnimatePresence: React.FC<{ children?: React.ReactNode } & any> = ({ children }) => <>{children}</>;
export const MotionConfig: React.FC<{ children?: React.ReactNode } & any> = ({ children }) => <>{children}</>;

export default {} as any;






















