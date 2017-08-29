/* 

@TODO: move the selector based on his previous position not always a new one
maybe use something like var savedAmount = { x: 0, y: 0 }; ??

       __                 _____      __          __ 
  ____/ /________ _____ _/ ___/___  / /__  _____/ /_
 / __  / ___/ __ `/ __ `/\__ \/ _ \/ / _ \/ ___/ __/
/ /_/ / /  / /_/ / /_/ /___/ /  __/ /  __/ /__/ /_  
\__,_/_/   \__,_/\__, //____/\___/_/\___/\___/\__/  
                /____/                              

 Key-Features

- No dependencies
- Add drag selection.
- Choose which elements can be selected.
- Awesome browser support, works even on IE9
- Ease of use
- Lightweight, only 1KB gzipped
- Free & open source under MIT License


 Classes

.ds-selected                   on elements that are selected


 Properties

** @selector          node            the square that will draw the selection
** @selectables       nodes           the elements that can be selected
** @onElementSelect   function        this is optional, it is fired every time an element is selected. This callback gets a property which is the just selected node
** @onElementUnselect function        this is optional, it is fired every time an element is de-selected. This callback gets a property which is the just de-selected node
** @callback          function        a callback function that gets fired when the element is dropped. This callback gets a property which is an array that holds all selected nodes

 Methods
** .start             ()                    reset the functionality after a teardown
** .stop              ()                    will teardown/stop the whole functionality
** .getSelection      ()                    returns the current selection
** .addSelectables    ([nodes])             add elements that can be selected. Intelligent algorythm never adds elements twice.
** .removeSelectables ([nodes])             remove elements that can be selected. Also removes the 'selected' class from those elements.




 STAR THIS PLUGIN ON GITHUB:

 https://github.com/ThibaultJanBeyer/dragSelect

 Please give it a like, this is what makes me happy :-)
 Thanks You



 ******************************************
 ********* The MIT License (MIT) **********
 ******************************************

 Copyright (c) 2017 ThibaultJanBeyer
 web: http://www.thibaultjanbeyer.com/
 github: https://github.com/ThibaultJanBeyer/dragSelect

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

*/

var dragSelect = function(options) {
  // Errors
  if(!options) {
    console.log('ERROR: dragSelect: please provide an options object to the function. See reference at: https://github.com/ThibaultJanBeyer/dragSelect for more info');
  }

  // Setup
  var selector,
      selectorPos,
      selectables,
      selectCallback,
      unselectCallback,
      callback,
      area,
      selected,
      cursorPos,
      scrollPos,
      initPos;

  function setup() {
    selector = options.selector || document.getElementById("rectangle");
    selectables = toArray(options.selectables) || [];
    selectCallback = options.onElementSelect || function() {};
    unselectCallback = options.onElementUnselect || function() {};
    callback = options.callback || function() {};
    area = options.area || document;

    selected = [];
  }
  setup();

  //- Start
  function start() {
    area.addEventListener('mousedown', startUp);
  }
  start();

  function startUp(e) {
    selector.style.display = 'block';

    // move element on location
    getStartingPositions(e);
    checkIfInside();
    
    area.removeEventListener('mousedown', startUp);
    area.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', reset);
  }

  // 1. GET STARTING COORDINATES
  function getStartingPositions(event) {
    cursorPos = getCursorPos(event);
    scrollPos = getScroll(area);
    
    initPos = {
      x: cursorPos.x + scrollPos.x,
      y: cursorPos.y + scrollPos.y
    };

    selectorPos = {};
    selectorPos.x = initPos.x;
    selectorPos.y = initPos.y;
    selectorPos.w = 1;
    selectorPos.h = 1;
    updateSelector();
  }

  // 2. GET MOVEMENT COORDINATES (difference)
  function getPositionDifference(event) {
    var newCursorPos = getCursorPos(event);
    var newScrollPos = getScroll(area);
    var oldCursorPos = cursorPos;
    var oldScrollPos = scrollPos;
    
    // let’s say I move the mouse down (y) by 10px and scroll (y) down by 5px
    // 1. get the difference between the old mouse position and the new one
    //    in our example that would be y: 10 - 0 = 5
    var cursorPosDiff = {
      x: newCursorPos.x - oldCursorPos.x,
      y: newCursorPos.y - oldCursorPos.y
    };

    // 2. get the difference amount between the old scroll and the new one
    //    in our example that is y: 5 - 0 = 5
    var scrollPosDiff = {
      x: newScrollPos.x - oldScrollPos.x,
      y: newScrollPos.y - oldScrollPos.y,
    };

    // 3. Calculate the grand total
    //    so we moved the mouse down by y: 10 + 5 = 15 from its original position
    var newPos = {
      x: cursorPosDiff.x + scrollPosDiff.x,
      y: cursorPosDiff.y + scrollPosDiff.y
    };

    // 4. Am I above the starting point or below, left or right?
    var direction = {
      x: newCursorPos.x - initPos.x > 0 ? true : false,  // true = moving to left
      y: newCursorPos.y - initPos.y > 0 ? true : false   // true = (below) = moving down
    };
    newPos.direction = direction;

    cursorPos = newCursorPos;
    scrollPos = newScrollPos;

    return newPos;
  }

  // resize that div while mouse is pressed
  function handleMove(event) {
    // if(options.area) { autoScroll(event); }  // scroll container while dragging
    resizeSelector();
    checkIfInside();
  }

  var goingUp = false;
  function resizeSelector() {
    var posDiff = getPositionDifference(event);

    selectorPos.w += posDiff.x;
    selectorPos.h += posDiff.y;

    updateSelector();
  }
  
  function checkIfInside() {
    // return elements that are inside the container
    for(var i = 0, il = selectables.length; i < il; i++) {
      var selectable = selectables[i];
      var index = selected.indexOf(selectable);

      if(isElementTouching(selectable, selector)) {
        if(index < 0) {
          selected.push(selectable);
          addClass(selectable, 'selected');
          selectCallback(selectable);
        }
      } else {
        if(index > -1) {
          selected.splice(selected.indexOf(selectable), 1);
          removeClass(selectable, 'selected');
          unselectCallback(selectable);
        }
      }
    }
  }

  // and finally unbind those functions when mouse click is released
  function reset() {
    selector.style.width = '0';
    selector.style.height = '0';
    selector.style.display = 'none';
    
    callback(selected);
    
    area.removeEventListener('mousemove', handleMove);
    area.addEventListener('mousedown', startUp);
  }

  //- Is Element touching Selection? (and vice-versa)
  function isElementTouching(element, container) {
    /**
     * calculating everything here on every move consumes more performance
     * but makes sure to get the right positions even if the containers are
     * resized or moved on the fly. This also makes the function kinda context independant.
     */
    var scroll = getScroll();

    var containerRect = {
      y: container.getBoundingClientRect().top + scroll.y,
      x: container.getBoundingClientRect().left + scroll.x,
      h: container.offsetHeight,
      w: container.offsetWidth
    };
    var elementRect = {
      y: element.getBoundingClientRect().top + scroll.y,
      x: element.getBoundingClientRect().left + scroll.x,
      h: element.offsetHeight,
      w: element.offsetWidth    
    };

    // Axis-Aligned Bounding Box Colision Detection.
    // Imagine following Example:
    //    b01
    // a01[1]a02
    //    b02      b11
    //          a11[2]a12
    //             b12
    // to check if those two boxes collide we do this AABB calculation:
    //& a01 < a12 (left border pos box1 smaller than right border pos box2)
    //& a02 > a11 (right border pos box1 larger than left border pos box2)
    //& b01 < b12 (top border pos box1 smaller than bottom border pos box2)
    //& b02 > b11 (bottom border pos box1 larger than top border pos box2)
    // See: https://en.wikipedia.org/wiki/Minimum_bounding_box#Axis-aligned_minimum_bounding_box and https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
    if (
      containerRect.x                   < elementRect.x + elementRect.w &&
      containerRect.x + containerRect.w > elementRect.x &&
      containerRect.y                   < elementRect.y + elementRect.h &&
      containerRect.h + containerRect.y > elementRect.y
    ) {
      return true; // collision detected!
    } else {
      return false;
    }
  }
  
  // Scroll the area by selecting
  function autoScroll(e) {
    var edge = isCursorNearEdge(e);
    scrolling = edge ? true : false;

    console.log('YOLO', edge);
    if(edge === 'top' && area.scrollTop > 0) {
      area.scrollTop -= 1;
    } else if(edge === 'bottom') {
      area.scrollTop += 1;
    } else if(edge === 'left' && area.scrollLeft > 0) {
      area.scrollLeft -= 1;
    } else if(edge === 'right') {
      area.scrollLeft += 1;
    }
  }

  // Check if the selector is near an edge of the area
  function isCursorNearEdge(e) {
    var cursorPosition = getCursorPos(e);
    var areaRect = getAreaRect(area);

    if(cursorPosition.y < 15) {
      return 'top';
    } else if(areaRect.height - cursorPosition.y < 15) {
      return 'bottom';
    } else if(areaRect.width - cursorPosition.x < 15) {
      return 'right';
    } else if(cursorPosition.x < 15) {
      return 'left';
    }

    return false;
  }

  //- Add/Remove Selectables
  function addSelectables(_nodes) {
    var nodes = toArray(_nodes);
    for (var i  = 0, il = nodes.length; i < il; i++) {
      var node = nodes[i];
      if(selectables.indexOf(node) < 0) {
        selectables.push(node);
      }
    }
  }

  function removeSelectables(_nodes) {
    var nodes = toArray(_nodes);
    for (var i  = 0, il = nodes.length; i < il; i++) {
      var node = nodes[i];
      if(selectables.indexOf(node) > 0) {
        removeClass(node, 'selected');
        selectables.splice(selectables.indexOf(node), 1);
      }
    }
  }

  function getSelection() {
    return selected;
  }

  //- Stop
  function stop() {
    reset();
    area.removeEventListener('mousedown', startUp);
    document.removeEventListener('mouseup', reset);
  }


  // Helpers
  ////////////////////////////////////////////////////////////////////////

  // sadly old phones/browsers do not support the quite new .classlist
  // so we have to use this workaround to add/remove classes
  // all credits to http://clubmate.fi/javascript-adding-and-removing-class-names-from-elements/
  function addClass( element, classname ) {
    var cn = element.className;
    //test for existance
    if( cn.indexOf(classname) !== -1 ) { return; }
    //add a space if the element already has class
    if( cn !== '' ) { classname = ' ' + classname; }
    element.className = cn+classname;
  }

  function removeClass( element, classname ) {
    var cn = element.className;
    var rxp = new RegExp( classname + '\\b', 'g' );
    cn = cn.replace( classname, '' );
    element.className = cn;
  }

  function toArray(obj) {
    if(!obj) { return false; }
    if(!obj.length && isElement(obj)) { return [obj]; }

    var array = [];
    for (var i = obj.length - 1; i >= 0; i--) { 
      array[i] = obj[i];
    }

    return array;
  }

  function isElement(obj) {
    try {
      //Using W3 DOM2 (works for FF, Opera and Chrom)
      return obj instanceof HTMLElement;
    }
    catch(e){
      //Browsers not supporting W3 DOM2 don't have HTMLElement and
      //an exception is thrown and we end up here. Testing some
      //properties that all elements have. (works on IE7)
      return (typeof obj==="object") &&
        (obj.nodeType===1) && (typeof obj.style === "object") &&
        (typeof obj.ownerDocument ==="object");
    }
  }


  // Node handling
  ////////////////////////////////////////////////////////////////////////

  function updateSelector() {
    selector.style.left = selectorPos.x + 'px';
    selector.style.top = selectorPos.y + 'px';

    // selector.style.width = selectorPos.w + 'px';
    // selector.style.height = selectorPos.h + 'px';
    selector.style.width = '1px';
    selector.style.height = '1px';

    selector.style.transformOrigin = 'top left';
    selector.style.transform = 'scaleX(' + selectorPos.w / selector.offsetWidth + ')' +
                               'scaleY(' + selectorPos.h / selector.offsetHeight + ')';

    console.log(selector.style.transform);
  }


  // Position determination logic
  ////////////////////////////////////////////////////////////////////////

  function getCursorPos(e) {
    var cPos = { // event.clientX/Y fallback for IE8-
      x: e.pageX || e.clientX,
      y: e.pageY || e.clientY
    };

    var areaRect = getAreaRect(area);

    var cursorPos = {
      x: cPos.x - areaRect.left,
      y: cPos.y - areaRect.top
    };

    return cursorPos;
  }

  function getAreaRect(area) {
    var areaRect = { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
    
    if(area) {
      areaRect = {
        top: area.getBoundingClientRect().top,
        left: area.getBoundingClientRect().left,
        bottom: area.getBoundingClientRect().bottom,
        right: area.getBoundingClientRect().right,
        width: area.offsetWidth,
        height: area.offsetHeight
      };
    }
    
    return areaRect;
  }

  function getScroll(area) {
    return {
      // fallback for IE9-
      y: area && area.scrollTop >= 0 ? area.scrollTop : window.scrollY || document.documentElement.scrollTop,
      x: area && area.scrollLeft >= 0 ? area.scrollLeft : window.scrollX || document.documentElement.scrollLeft
    };
  }


  // Return
  ////////////////////////////////////////////////////////////////////////

  var DS = {
    isElement: isElement,
    toArray: toArray,
    removeClass: removeClass,
    addClass: addClass,
    stop: stop,
    isElementTouching: isElementTouching,
    reset: reset,
    checkIfInside: checkIfInside,
    handleMove: handleMove,
    startUp: startUp,
    start: start,
    getSelection: getSelection,
    removeSelectables: removeSelectables,
    addSelectables: addSelectables
  };
  return DS;

};


// Make Exportable
////////////////////////////////////////////////////////////////////////

if (typeof module !== 'undefined' && module !== null) {
  module.exports = dragSelect;
} else {
  window.dragSelect = dragSelect;
}

// Relevant Discussions:
// https://stackoverflow.com/questions/11979586/select-and-drag-to-get-selected-elements
// https://stackoverflow.com/questions/5851156/javascript-drag-select-functionality-done-right
// https://plainjs.com/
// http://youmightnotneedjqueryplugins.com/
// https://codecanyon.net/item/grapesheadlines-animated-headers/19715814?s_rank=1 ???
