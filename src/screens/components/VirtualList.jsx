import React, { useState, useCallback } from 'react';

// Virtual scrolling component for large lists
// Only renders visible items in the viewport for optimal performance
export default function VirtualList(props) {
  var {
    items,
    itemHeight,
    containerHeight,
    renderItem,
    className,
    style
  } = props;

  var [scrollTop, setScrollTop] = useState(0);

  var startIndex = Math.floor(scrollTop / itemHeight);
  var visibleCount = Math.ceil(containerHeight / itemHeight) + 1;
  var endIndex = Math.min(startIndex + visibleCount, items.length);
  var visibleItems = items.slice(startIndex, endIndex);
  var offsetY = startIndex * itemHeight;
  var totalHeight = items.length * itemHeight;

  var handleScroll = useCallback(function(e) {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      className={className}
      style={{
        ...style,
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{height: totalHeight, position: 'relative'}}>
        <div style={{
          transform: 'translateY(' + offsetY + 'px)',
          position: 'relative'
        }}>
          {visibleItems.map(function(item, idx) {
            return renderItem(item, startIndex + idx);
          })}
        </div>
      </div>
    </div>
  );
}
