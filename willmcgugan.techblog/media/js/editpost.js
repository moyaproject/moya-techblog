function update_preview()
{
    var $preview = $('#post-preview');
    var $form = $('form#edit-post');
    var $editor = $form.find('textarea[name=content]');
    var post_id = parseInt($form.find('input[name=post_id]').val());
    var markup = $form.find('select[name=markup]').val();

    var content = $editor.val();
    var params = {
        content:content,
        post_id:post_id,
        markup:markup
    }
    $preview.css('opacity', '0.2');
    get_rpc().call(
        'preview_content',
        params,
        function(result){
           $preview.css('opacity', '1.0');
           $preview.html(result.html);
        });
};

function on_pick_post_images(collection_uuid, images, callback)
{
    var $content = $('textarea[name=content]');
    var params = {collection_uuid:collection_uuid,
                images:images};

    draft_changes += 1;
    check_draft_status();

    rpc = get_rpc();
    rpc.call('render_images', params, function(result){
        $content.focus().blur();
        var textarea = $content[0];
        var value = textarea.value;
        var text_start = value.substring(0, textarea.selectionStart);
        var text_end = value.substring(textarea.selectionEnd, value.length);
        textarea.value = text_start + result.html + text_end;

        draft_changes += 1;
        check_draft_status();

        on_draft_change();
        update_preview();
        callback();
    });
}

function on_images_change(collection_uuid)
{
    update_preview();
}

draft_changes = 0;
draft_saved_changes = 0;
draft_saves_count = 0;

function check_draft_status()
{
    var $status = $('.techblog-draft-status');
    if(draft_saves_count != 0)
    {
        $status.removeClass('saved');
        $status.removeClass('changed');
        $status.addClass('saving');
    }
    else
    {
        if(draft_changes == draft_saved_changes)
        {
            $status.removeClass('changed');
            $status.removeClass('saving');
            $status.addClass('saved');
        }
        else
        {
            $status.removeClass('saving');
            $status.removeClass('saved');
            $status.addClass('changed');
        }
    }
}

function on_draft_change()
{
    var $form = $('form#edit-post');
    check_draft_status();
    var post_id = parseInt($form.find('input[name=post_id]').val());
    var data = get_form_data();
    var rpc = get_rpc();
    draft_saves_count += 1;
    check_draft_status();
    rpc.call(
        'save_draft',
        {post_id:post_id,
         count:draft_changes,
         draft:data},
        function(result){
            draft_saves_count -= 1;
            if(result.status=='success')
            {
                draft_saved_changes = result.count;
            }
            check_draft_status();
        }
    );
}

function get_form_data()
{
    var $form = $('form#edit-post');
    var data = {};
    $form.find('textarea,input,select').each(function(i, el){
        var $input = $(el);
        var name = $input.attr('name');
        if(name[0] != '_')
        {
            data[$input.attr('name')] = $input.val();
        }
    });
    return data;
}

$(function(){

    save_timeout = null;
    var $form = $('form#edit-post');
    var $editor = $form.find('textarea[name=content]');
    $editor.change(function(e){
        update_preview();
    });
    $form.find('select[name=markup]').change(function(e){
        update_preview();
    });
    $form.find('input,textarea').bind('input', function(e){
        draft_changes += 1;
        check_draft_status();
        if(save_timeout)
        {
            clearTimeout(save_timeout);
        }
        save_timeout = setTimeout(on_draft_change, 1500);
    });

    function on_change()
    {
        on_draft_change();
    }

    $form.find('textarea,input,select').change(function(e){
        var $input = $(this);
        on_change($input);
    });

    update_preview();

    $('button[value=cancel]').click(function(e){
        return window.confirm('Are you sure you want to discard this draft (including images)?');
    });
});
