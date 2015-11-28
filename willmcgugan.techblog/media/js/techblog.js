$(function(){

    function update_nav_opacity()
    {
        /*
            Make the navbar 50% opacity, but blend to opaque as the user scrolls.
        */
        var $img = $('.techblog-post-image > .techblog-post-titles');
        if (!$img.length)
        {
            return;
        }
        var $nav = $('nav.navbar-fixed-top');
        var scroll_y = window.scrollY;
        var win_height = $(window).height();
        var opacity = Math.min(0.5 + (scroll_y / win_height) * 0.5, 1.0);
        $nav.css('background-color', 'rgba(34, 34, 34, ' + opacity + ')');
    }
    $(window).scroll(function(e){
        update_nav_opacity();
    });
    update_nav_opacity();
});

$(function(){
    $('.moya-comment-form-editor').each(function(i, el){
        var $form = $(this);
        var $edit = $form.find('textarea');
        var $preview = $form.find('.preview-comment');

        $edit.change(function(){
            var markup = $form.data('markup');
            var comment = $form.find('textarea').val();
            get_rpc().call(
                'preview_comment',
                {comment:comment, markup:markup},
                function(result){
                    $preview.html(result.html);
                    highlight_code($preview);
                }
            );
        });

    });
});


techblog_rpc = null;
function get_rpc()
{
    if (techblog_rpc === null)
    {
        var rpc_url = $('input[name=techblog_rpc]').val();
        techblog_rpc = new JSONRPC(rpc_url);
    }
    return techblog_rpc;
}


$(function(){

    $(window).on('hashchange', function() {
        var hash = location.hash.substr(1);
        if(hash)
        {
            $('a[name=' + location.hash.substr(1) + '] img.techblog-image').click();
        }
        else {
            $('#techblog-expanded-image').removeClass('visible');
            $('body').removeClass('show-frame');
        }
    });

    $('#techblog-expanded-image').click(function(e){
        $(this).removeClass('visible');
        $('body').removeClass('show-frame');
    });

    $('.techblog-image-type-photo').click(function(e){
        var $img = $(this);
        var data = $img.data();
        var $expanded_img = $('#techblog-expanded-image');
        var hash = data.slug;
        if (hash && window.location.hash != '#' + hash)
        {
            history.pushState(null, null, '#' + hash);
        }

        $('#techblog-expanded-image .image-wait').addClass('loading');

        var img = new Image();
        img.onload = function(e){
            if (window.devicePixelRatio >= 2 && (data.width >= 1920 || data.height >= 1080))
            {
                $('#techblog-expanded-image .frame').css('background-image', 'url(' + data.xlg2x + ')');
            }
            else
            {
                $('#techblog-expanded-image .frame').css('background-image', 'url(' + data.xlg + ')');
            }
            $('#techblog-expanded-image').css('background-image', 'url(' + data.blur + ')');
            $('#techblog-expanded-image .image-details').html(data.details);
            $('#techblog-expanded-image .image-author').html(data.author);

            $expanded_img.addClass('visible');
            if (!('ontouchstart' in document.documentElement))
            {
                setTimeout(function(){
                    $('body').addClass('show-frame');
                }, 500);
            }
        }
        img.src = data.blur;
        var lg_img = new Image();
        lg_img.onload = function(e){
            $('#techblog-expanded-image .image-wait').removeClass('loading');
        }
        lg_img.src = data.xlg;

    });
    if(location.hash)
    {
        $('img[name=' + location.hash.substr(1) + ']').click();
    }
});


$(function(){

    $(function () {
        $('[data-toggle="tooltip"]').tooltip({html:true})
    });
    function resize_titles(){
        $('.techblog-post-image').height($(window).height());
    }
    $(window).on("orientationchange",function(){
        setTimeout(resize_titles, 250);
    });
    if('ontouchstart' in window)
    {
        resize_titles();
    }
});

function highlight_code($el)
{
    $el.find('code').each(function(i, el){
        var $code = $(this);
        var language_spec = $code.attr('class');
        if (language_spec)
        {
            var language = language_spec.split('-')[1];
            if (language)
            {
                $code.attr('class', language);
                hljs.highlightBlock($code[0]);
            }
        }
        else
        {
            /*$code.addClass('hljs');*/
        }
    });
}

$(function(){
    $('body').addClass('loaded');
    highlight_code($('pre'));
});
