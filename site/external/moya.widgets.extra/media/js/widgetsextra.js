(function($) {

    $.fn.moyaSelect = function(options) {

        var options = options || {};
        var UP=38;
        var DOWN=40;
        var RETURN=13;
        var ESCAPE=27;
        var TAB = 9;

        var $this = $(this);
        var $container = $this;
        var max_result = $this.data('count') - 1;
        var selection = parseInt($this.data('active'));

        var $input = $this.find('input');
        var $options = $this.find('.moya-widgets-select')
        var $current = $this.find('.moya-widgets-select-current');
        var $active = $this.find('.moya-widgets-option.active');

        function is_disabled()
        {
            return $this.attr('disabled') == 'disabled';
        }

        function update_height()
        {
            var $o = $options.clone();
            $('body').append($o);
            var height = 0;
            var win_height = $(window).height();
            var max_height = Math.min(800, win_height * 0.8);
            $o.find('.moya-widgets-option').each(function(i, el){
                if(i>=10)
                {
                    return false;
                }
                var option_height = $(el).outerHeight();
                if (height + option_height >= max_height && i >= 2)
                {
                    return false;
                }
                height += $(el).outerHeight();
            });
            var gutter = $o.outerHeight() - $o.innerHeight();
            height += gutter;
            $options.css('max-height', height + 'px');
            $o.remove();
        }

        $input.focus(function(e){
            $this.remove('focused');
            $options.css('width', $current.width() + 'px');
            show_options();
            $container.addClass('focused');
            refresh_selection();
        });

        $input.blur(function(e){
            $container.removeClass('focused');
        });

        $this.find('.moya-widgets-select-current').click(function(e){
            e.preventDefault();
            if(is_disabled())
            {
                return;
            }
            $input.focus();
        });

        $this.find('.moya-widgets-select .moya-widgets-option').mousedown(function(e){
            e.preventDefault();
            if(is_disabled())
            {
                return;
            }
            var $option = $(this);
            $this.find('.moya-widgets-option').removeClass('active');
            $option.addClass('active');
            selection = $option.data('index');
            var value = $option.data('value');
            $input.val(value);
            refresh_selection();
            $input.focus();
            $this.removeClass('focused');
            $container.removeClass('focused');
        });

        function refresh_selection()
        {
            update_height();
            $this.find('.moya-widgets-option').removeClass('active');
            $this.find('.moya-widgets-option.option-' + selection).addClass('active');
            var $active = $options.find('.moya-widgets-option.active');
            var value = $active.data('value');

            if (!$active.length)
            {
                return;
            }
            var active_html = $active[0].outerHTML;
            $current.html(active_html);
            $input.val(value);
            var row_h = $active.outerHeight();
            var container_h = $options.height();
            var scroll = $options.scrollTop();
            var y = $active.offset().top - $options.offset().top + scroll - 1;

            if (y - scroll + row_h > container_h)
            {
                $options.scrollTop(y - container_h + row_h);
            }
            else if (y - scroll < 0)
            {
                $options.scrollTop(y);
            }
        }

        function scoll_to_top()
        {
            var $active = $options.find('.moya-widgets-option.active');

            if (!$active.length)
            {
                return;
            }
            var row_h = $active.outerHeight();
            var container_h = $options.height();
            var scroll = $options.scrollTop();
            var y = $active.offset().top - $options.offset().top + scroll - 1;

            $options.scrollTop(y);
        }

        function set_width()
        {
            if($current.is(':visible'))
            {
                $options.css('width', $current.width() + 'px');
            }
        }

        function show_options()
        {
            var is_focused = $this.hasClass('focused');
            $this.addClass('focused');
            if(!is_focused)
            {
                scoll_to_top();
            }
        }

        $input.keydown(function(e)
        {
            set_width();
            if (e.which==UP)
            {
                show_options();
                if (selection > 0)
                {
                    selection -= 1;
                    refresh_selection();
                }
                e.preventDefault();
            }
            else if (e.which==DOWN)
            {
                show_options();
                if (selection == -1)
                {
                    selection = 0;
                    refresh_selection();
                }
                else if (selection < max_result)
                {
                    selection += 1;
                    refresh_selection();
                }
                e.preventDefault();
            }
            else if (e.which==ESCAPE)
            {
                $this.removeClass('focused');
            }
            else if (e.which==RETURN)
            {
                e.preventDefault();
                $this.removeClass('focused');
                return;
            }
        });

        refresh_selection();
        $(function(){
            update_height();
            refresh_selection();
        });
    }

})(jQuery);
