/*
 * angular-elastic v0.0.3
 * (c) 2013 Monospaced http://monospaced.com
 * License: MIT
 */

angular.module('monospaced.elastic', [])
  .directive('msdElastic', ['$timeout', '$window', function($timeout, $window){
    'use strict';

    return {
      restrict: 'A, C',
      link: function(scope, element){

        var animate = false;

        var $ta = element,
            // cache a reference to the DOM element
            ta = element[0];

        // ensure appropriate element and brower support
        if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
          return;
        }

        // set these properties before measuring dimensions
        $ta.css({
          'overflow': 'hidden',
          'overflow-y': 'hidden',
          'word-wrap': 'break-word'
        });

        var $win = angular.element($window),
            $mirror = angular.element('<textarea tabindex="-1" style="position: absolute; ' +
                                      'top: -999px; right: auto; bottom: auto; left: 0 ;' +
                                      'overflow: hidden; -webkit-box-sizing: content-box; ' +
                                      '-moz-box-sizing: content-box; box-sizing: content-box; ' +
                                      'min-height: 0!important; height: 0!important; padding: 0;' +
                                      'word-wrap: break-word; border: 0;"/>').data('elastic', true),
            mirror = $mirror[0],
            taStyle = getComputedStyle(ta),
            resize = taStyle.getPropertyValue('resize'),
            borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                        taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                        taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
            boxOuter = !borderBox ? {width: 0, height: 0} : {
                          width: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                 parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                 parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                 parseInt(taStyle.getPropertyValue('border-bottom-width'), 10),
                          height: parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                  parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                  parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                  parseInt(taStyle.getPropertyValue('border-left-width'), 10)
                        },
            minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
            minHeight = Math.max(minHeightValue, ta.offsetHeight) - boxOuter.height,
            maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
            mirrored,
            active,
            copyStyle = ['font-family',
                         'font-fize',
                         'font-weight',
                         'font-style',
                         'letter-spacing',
                         'line-height',
                         'text-transform',
                         'word-spacing',
                         'text-indent'];

        // exit if elastic already applied (or is the mirror element)
        if ($ta.data('elastic')) {
          return;
        }

        // Opera returns max-height of -1 if not set
        maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

        // append the mirror to the DOM
        if (mirror.parentNode !== document.body) {
          angular.element(document.body).append(mirror);
        }

        // set resize and apply elastic
        $ta.css({
          'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
        }).data('elastic', true);

        /*
         * methods
         */

        function initMirror(){
          mirrored = ta;
          taStyle = getComputedStyle(ta);
          angular.forEach(copyStyle, function(val){
            mirror.style[val] = taStyle.getPropertyValue(val);
          });
        }

        function adjust() {
          var width,
              height,
              overflow,
              original;

          if (mirrored !== ta) {
            initMirror();
          }

          // active flag prevents actions in function from calling adjust again
          if (!active) {
            active = true;
            mirror.value = ta.value + (animate ? '\n' : '');
            mirror.style.overflowY = ta.style.overflowY;
            original = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

            // update width in case the original textarea width has changed
            width = parseInt(borderBox ?
                             ta.offsetWidth :
                             getComputedStyle(ta).getPropertyValue('width'), 10) - boxOuter.width;
            mirror.style.width = width + 'px';

            height = mirror.scrollHeight;

            if (height > maxHeight) {
              height = maxHeight;
              overflow = 'scroll';
            } else if (height < minHeight) {
              height = minHeight;
            }

            height += boxOuter.height;
            ta.style.overflowY = overflow || 'hidden';

            if (original !== height) {
              ta.style.height = height + 'px';
            }

            // small delay to prevent an infinite loop
            $timeout(function(){
              active = false;
            }, 1);

          }
        }

        function forceAdjust(){
          active = false;
          adjust();
        }

        /*
         * initialise
         */

        // listen
        if ('onpropertychange' in ta && 'oninput' in ta) {
          // IE9
          ta['oninput'] = ta.onkeyup = adjust;
        } else {
          ta['oninput'] = adjust;
        }

        $win.bind('resize', forceAdjust);

        // in case textarea already contains text
        adjust();

        if (animate) {
          $timeout(function(){
            $ta.css({
              '-webkit-transition': 'height 50ms ease-in-out',
                 '-moz-transition': 'height 50ms ease-in-out',
                   '-o-transition': 'height 50ms ease-in-out',
                      'transition': 'height 50ms ease-in-out'
            });
        });
        }

        /*
         * destroy
         */

        scope.$on('$destroy', function(){
          $mirror.remove();
          $win.unbind('resize', forceAdjust);
        });
      }
    };

  }]);
