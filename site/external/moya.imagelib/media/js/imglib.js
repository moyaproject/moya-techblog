function quote(t)
{
    return "'" + t + "'";
}

function FileUploader(url, file, callbacks)
{
    callbacks['progress'] = callbacks.progress || function(progress) {};
    callbacks['success'] = callbacks.success || function(result) {};
    callbacks['error'] = callbacks.error || function() {};

    var self = this;
    var reader = new FileReader();
    var xhr = new XMLHttpRequest();

    var form_data = new FormData();
    form_data.append('image', file);

    self.xhr = xhr;

    xhr.upload.addEventListener("progress", function(e) {
        if (e.lengthComputable) {
          var ratio = e.loaded / e.total;
          callbacks.progress(ratio);
        }
      }, false);

    xhr.upload.addEventListener("load", function(e){
        callbacks.progress(1.0);
    }, false);

    xhr.onreadystatechange = function(){
        if(xhr.readyState==4)
        {
            if(xhr.status==200)
            {
                callbacks.success(xhr.responseText);
            }
            else
            {
                callbacks.error(xhr);
            }
        }
    }

    xhr.open("POST", url);

    reader.onload = function(evt) {

        callbacks.progress(0);
        xhr.send(form_data);
    };
    reader.readAsBinaryString(file);
}

(function($) {

    $.fn.imguploader = function(options)
    {
        var $self = $(this);
        var $upload_form = $self.find('form.upload');
        var $file_input = $upload_form.find('input[type=file]');
        var $controls = $self.find('.moya-imglib-upload-controls');
        var $image_container = $self.find('.moya-imglib-upload-image');
        var $progress = $self.find('.moya-imglib-progress');
        var $progress_bar = $progress.find('.progress-bar .complete');
        var $error = $self.find('.moya-imglib-error');

        function default_on_change(uuid)
        {
            console.log('uploaded', uuid);
        }
        var on_change = options.on_change || default_on_change;

        var data = $self.data();
        var upload_url = data.upload_url;

        $error.find('button.close').click(function(){
            $error.hide();
        });

        $controls.click(function(e){
            $error.hide();
            if($self.hasClass('loading'))
            {
                return;
            }
            e.preventDefault();
            $file_input.click();
        });

        $file_input.change(function(e){
            e.preventDefault();
            var files = $file_input.get(0).files;
            begin_upload(files[0]);
            $upload_form[0].reset()
            return false;
        });

        function set_progress(progress)
        {
            var w = Math.ceil(100.0 * (0.90 * progress + 0.10));
            var width_percentage = '' + w + '%';
            $progress_bar.css('width', width_percentage);
        }

        function set_error(msg)
        {
            $error.find('.error-text').text(msg);
            $error.show();
        }

        function begin_upload(file)
        {
            $progress.removeClass('processing');
            set_progress(0);
            $self.addClass('loading');
            var url = upload_url;

            var uploader = new FileUploader(url, file,
            {
                "progress": function(progress)
                {
                    if(progress > 0.99)
                    {
                        $progress.addClass('processing');
                    }
                    set_progress(progress);
                },
                "success": function(json_result)
                {
                    var result = JSON.parse(json_result);

                    if (result.state != 'ok')
                    {
                        $self.removeClass('loading');
                        set_progress(0);
                        set_error(result.msg || 'upload failed');
                        return;
                    }

                    data.image = result.image_id;
                    $progress.addClass('processing');

                    var replace_thumb = function(uuid)
                    {
                        $self.removeClass('loading');
                        $image_container.replaceWith($(result.image_html));
                        $image_container = $self.find('.moya-imglib-upload-image');
                        $progress.removeClass('processing');
                        on_change(uuid);
                    }

                    var image = new Image();
                    image.src = result.thumb_url;

                    if (image.complete)
                    {
                        replace_thumb(result.image_id);
                    }
                    else
                    {
                        image.addEventListener('load', function(){replace_thumb(result.image_id)});
                    }
                },
                "error": function(xhr)
                {
                    $self.removeClass('loading');
                    set_progress(0);
                    if (xhr.status==413)
                    {
                        set_error(quote(file.name) + ' is too large');
                    }
                    else
                    {
                        set_error(quote(file.name) + ' was not uploaded');
                    }
                }
            });
        }

    }

})(jQuery);


(function($) {

    $.fn.imgmanager = function(options)
    {
        function default_on_pick(uuid, selected, callback)
        {
            console.log(uuid, selected);
            callback();
        }
        function default_on_selection(uuid)
        {
            console.log(uuid);
        }

        function default_on_change(uuid)
        {
            console.log(uuid, 'changed')
        }

        var on_pick = options.on_pick || default_on_pick;
        var on_selection = options.on_selection || default_on_selection;
        var on_change = options.on_change || default_on_change;

        var $manager = $(this);
        var $images = $manager.find('.moya-imglib-image-container');
        var $header = $manager.find('.moya-imglib-header');
        var $edit_button = $manager.find('button.moya-imglib-action-edit');
        var $form = $manager.find('.moya-imglib-image-form');
        var data = $manager.data();
        var single = data['single']
        var edit = data['edit'];
        var collection_uuid = data['collection'];
        var upload_url = data['upload_url'];
        var rpc_url = data['rpc_url']
        var rpc = new JSONRPC(rpc_url);
        var $search = $manager.find('input[name=search]');
        var editing_image = null;

        var progress_template = $manager.find('script.progress-template').html();

        var upload_template = $manager.find('script.upload-form-template').html();
        var $uploader = $(upload_template);

        var el = $manager[0];

        var $upload = $manager.find('.moya-imglib-manager-upload');
        var $upload_form = $uploader;

        var $file_input = $uploader.find('input[type=file]');
        var $error = $manager.find('.moya-imglib-error');

        $error.find('button.close').click(function(){
            $error.hide();
        });

        function is_touch_device() {
          return !!('ontouchstart' in window);
        }

        if(is_touch_device())
        {
            $manager.addClass('moya-touch-device');
        }

        function update_selection()
        {
            var selected_count = $images.find('.moya-imglib-image.selected').length;
            if(selected_count)
            {
                $header.addClass('with-selections');
            }
            else {
                $header.removeClass('with-selections');
            }
            if(selected_count==1)
            {
                $edit_button.removeAttr('disabled');
            }
            else
            {
                $edit_button.attr('disabled', 'disabled');
            }
            if(!selected_count)
            {
                on_selection(null);
            }
        }

        function update_search()
        {
            var search = $search.val();
            if(!search)
            {
                $images.find('.moya-imglib-image').removeClass('moya-imglib-hidden');
            }
            else
            {
                $images.find('.moya-imglib-image').each(function(i, el){
                    var $image = $(el);
                    var data = $image.data();
                    $image.toggleClass('moya-imglib-hidden', data.title.indexOf(search.toLowerCase()) == -1);
                });
            }
        }

        $search.keyup(function(e){
            update_search();
        });

        $upload.click(function(e){
            e.preventDefault();
            e.stopPropagation();
            $file_input.click();
            return false;
        });

        $file_input.change(function(){
            var files = $file_input.get(0).files;
            upload_files(files);
            $upload_form[0].reset()
        });

        $header.find('.moya-imglib-action').click(function(){
            var action = $(this).data()['action'];

            if (action=='select-clear')
            {
                $images.find('.moya-imglib-image').removeClass('selected');
                update_selection();
            }
            else if (action=='select-all')
            {
                $images.find('.moya-imglib-image').addClass('selected');
                update_selection();
            }
            else if (action=='delete')
            {
                $header.addClass('confirm-delete');
                $header.find('moya-imglib-confirm  span').text('delete?')
            }
            else if (action=='cancel-delete')
            {
                $header.removeClass('confirm-delete');
            }
            else if (action=='confirm-delete')
            {
                delete_selected();
            }
            else if (action=='edit')
            {
                edit_selected();
            }
            else if (action=='pick')
            {
                pick_selected();
            }
            return false;
        });

        $manager.on('click', '.moya-imglib-image', function(e){
            var $img = $(this);
            var image_data = $img.data();
            if(!is_touch_device())
            {
                if(single || (!e.shiftKey && !$img.hasClass('selected')) )
                {
                    $images.find('.moya-imglib-image').removeClass('selected');
                }
            }
            $img.toggleClass('selected');
            $header.removeClass('confirm-delete');
            update_selection();
            on_selection(image_data.uuid);
        });

        $manager.find('button[name=upload]').click(function(e){
            e.preventDefault();
            e.stopPropagation();
            $file_input.click();
            return false;
        });

        $form.on('click', 'button[name=cancel]', function(){
            $manager.removeClass('edit-image');
            return false;
        });

        $form.on('click', 'button[type=submit]', function(e){
            e.preventDefault();
            var form_data = {};
            $form.find('input,textarea,select').each(function(){
                var $input = $(this);
                var name = $input.attr('name');
                var value = $input.val();
                if ($input.attr('type') == 'radio')
                {
                    if ($input.is(':checked'))
                    {
                        form_data[name] = $input.attr('value')
                    }
                }
                else
                {
                    form_data[name] = value;
                }
            });

            var image = editing_image;
            var params = {
                "collection": collection_uuid,
                "image": image,
                "bind": form_data,
                "edit": edit
            }
            rpc.call(
                'image.manager_form',
                params,
                function(result){
                    $form.html(result.html);
                    $manager.addClass('edit-image');
                    if(result.valid)
                    {
                        $manager.removeClass('edit-image');
                        $images.find('.moya-imglib-image[name=' + result.replace + ']' ).replaceWith($(result.tile_html));
                        var $new_image = $images.find('.moya-imglib-image[name=' + result.replace + ']');
                        set_tooltip($new_image);
                        update_selection();
                        on_change(collection_uuid);
                    }
                }
            )
        });

        $images.find('a').on('click', function(e){
            e.stopPropagation();
        });

        $images.on('click', '.moya-imglib-image .moya-imglib-edit', function(e){
            e.preventDefault();
            e.stopPropagation();
            var image = $(this).data('image');
            edit_image(image);
            return false;
        });

        function edit_selected()
        {
            var image = $images.find('.moya-imglib-image.selected').data('uuid');
            edit_image(image);
        }

        function pick_selected()
        {
            var picked = [];
            $images.find('.moya-imglib-image.selected').each(function(i, el){
                var uuid = $(el).data('uuid');
                picked.push(uuid);
            });
            on_pick(collection_uuid, picked, function(){
                $images.find('.moya-imglib-image.selected').removeClass('selected');
                update_selection();
            });
        }

        function edit_image(image)
        {
            var params = {
                "collection": collection_uuid,
                "image": image,
                "edit": edit
            }
            rpc.call(
                'image.manager_form',
                params,
                function(result){
                    $form.html(result.html);
                    editing_image = result.image;
                    $manager.addClass('edit-image');
                }
            )
        }

        function delete_selected()
        {
            var images = [];
            $images.find('.moya-imglib-image.selected').each(function(i, el){
                var $img = $(this);
                var img_data = $img.data();
                images.push(img_data.uuid);
            });
            var params = {
                "collection": collection_uuid,
                "images": images
            }
            $header.removeClass('confirm-delete');
            update_selection();
            rpc.call(
                'image.delete',
                 params,
                 function(result){
                    $(result.deleted).each(function(i, uuid){
                        var $image = $images.find(".moya-imglib-image[name=" + uuid + "]");
                        /* $image.removeClass('selected'); */
                        $image.addClass('moya-imglib-deleted');
                        $header.removeClass('confirm-delete');
                        update_selection();
                        on_change(collection_uuid);
                    });
                    setTimeout(function(){
                        $images.find('.moya-imglib-image.moya-imglib-deleted').removeClass('selected').remove();
                        update_selection();
                    }, 500)
                }
            );

        }

        function set_progress($progress, progress)
        {
            /* $progress.find('.progress-remaining').css('height', (1 - progress) + 'em'); */
            $progress.find('.moya-imglib-progress').show();
            $progress.find('.progress-bar .complete').css('width', '' + (5 + (progress * 95)) + '%');
        }

        function set_error(msg)
        {
            $error.find('.error-text').text(msg);
            $error.show();
        }

        function begin_upload(file)
        {
          var $progress = $(progress_template);
          $images.prepend($progress);
          var image_upload_url = upload_url;
          if(edit)
          {
            image_upload_url += '?edit=yes'
          }
          var uploader = new FileUploader(image_upload_url, file,
          {
              "progress": function(progress)
              {
                    if(progress > .99)
                    {
                        $progress.addClass('processing');
                    }
                    set_progress($progress, progress);
              },
              "success": function(result)
              {
                  set_progress($progress, 1);
                  var json_result = JSON.parse(result);

                  if (json_result.state != 'ok')
                  {
                      /* TODO: Report message */
                      set_error(json_result.msg);
                      $progress.remove();
                      return;
                  }
                  $progress.addClass('processing');

                  var replace_thumb = function(){
                      var $image = $(json_result.image_html);
                      $image.css('opacity', '0');
                      var $new_image = $progress.replaceWith($image);
                      $image.animate({opacity: 1.0}, 250);
                      set_tooltip($image);
                  }

                  var image = new Image();
                  image.src = json_result.thumb_url;

                  if (image.complete)
                  {
                      replace_thumb();
                  }
                  else {
                      image.addEventListener('load', replace_thumb);
                  }
                  on_change(collection_uuid);
              },
              "error": function(xhr)
              {
                $progress.fadeOut('fast').remove();
                if (xhr.status==413)
                {
                    set_error(quote(file.name) + ' is too large');
                }
                else
                {
                    set_error(quote(file.name) + ' was not uploaded');
                }
              }
          });
        }

        function upload_files(files)
        {
          for(var i=0; i < files.length; i++)
          {
            begin_upload(files[i]);
          }
        }

        function set_tooltip($el)
        {
            $el.tooltip({html:true, placement:'top', delay:300});
        }
        set_tooltip($manager.find("[data-toggle='tooltip']"));
        update_selection();

    }

}(jQuery));
