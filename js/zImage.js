;(function($,window,document,undefined){

    $.fn.zImage = function(options){
        return new zImage(this,options);
    }

    /**
     * 图片处理类
     * @param that   this对象
     * @param rotate    旋转角度
     * @param customWidth   自定义图片宽度
     * @param customHeight  自定义图片高度
     * @param imgData  生成的图片数据
     * @param type  Í¼Æ¬ÀàÐÍ
     * @param sourceType  上传的图片类型jpg，png
     * @param encoderOptions  图片质量
     * @param red  滤镜，红色
     * @param green  滤镜，绿色
     * @param blue 滤镜，蓝色
     * @param opacity  透明度，0透明，255不透明。
     * @param targetColor  需要替换的颜色
     */
    var zImage = function(that,options){
        this.img = that[0];
        this.srcImgWidth = this.img.naturalWidth;
        this.srcImgHeight = this.img.naturalHeight;
        this.canvas = document.createElement('canvas');
        this.width = options.customWidth ? options.customWidth : this.srcImgWidth;
        this.height = options.customHeight ? options.customHeight : this.srcImgHeight;
        this.rotate = options.rotate;
        this.imgData = {};
        this.type = that.attr('data-imgType') ? that.attr('data-imgType') : "image/png";
        this.sourceType = that.attr('data-imgType') ? that.attr('data-imgType') : "image/png";
        this.encoderOptions = 0.92;
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.opacity = '';
        this.removeColorStart = [];
        this.removeColorEnd = [];
        this.targetColor = [];
        this.cropBox = '';    //截图的图片
        this.cropBoxInfo = {};  //截图相对于原图的位置信息
        this.offsetColor = 3;   //色差偏移值
        this.isPart = 0;    //是否开启局部抠图
        return this;
    }

    zImage.prototype = {
        setCropBox : function(cropBox){
            this.cropBox = cropBox !== '' ? cropBox : '';
        },
        setCropBoxInfo : function(cropBoxInfo){
            this.cropBoxInfo = cropBoxInfo.width ? cropBoxInfo : {};
        },
        setRemoveColorStart : function(removeColorStart){
            if(removeColorStart !== '' && removeColorStart != undefined){
                this.removeColorStart[0] = parseInt(removeColorStart.substring(0,2),16);
                this.removeColorStart[1] = parseInt(removeColorStart.substring(2,4),16);
                this.removeColorStart[2] = parseInt(removeColorStart.substring(4,6),16);
            }else{
                this.removeColorStart = [];
            }
        },
        setRemoveColorEnd : function(removeColorEnd){
            if(removeColorEnd !== '' && removeColorEnd != undefined){
                this.removeColorEnd[0] = parseInt(removeColorEnd.substring(0,2),16);
                this.removeColorEnd[1] = parseInt(removeColorEnd.substring(2,4),16);
                this.removeColorEnd[2] = parseInt(removeColorEnd.substring(4,6),16);
            }else{
                this.removeColorEnd = [];
            }
        },
        serTargetColor : function(targetColor){
            if(targetColor !== '' && targetColor != undefined){
                this.targetColor[0] = parseInt(targetColor.substring(0,2),16);
                this.targetColor[1] = parseInt(targetColor.substring(2,4),16);
                this.targetColor[2] = parseInt(targetColor.substring(4,6),16);
            }else{
                this.targetColor = [];
            }
        },
        setType : function(type){
            this.type = type !== '' ? type : this.sourceType;
        },
        setEncoderOptions : function(encoderOptions){
            this.encoderOptions = encoderOptions !== '' && encoderOptions >= 0 ? parseFloat(encoderOptions) : 0.92;
        },
        setRed : function(red){
            this.red = red !== '' && red >= 0 ? parseInt(red) : 0;
        },
        setGreen : function(green){
            this.green = green !== '' && green >= 0 ? parseInt(green) : 0;
        },
        setBlue : function(blue){
            this.blue = blue !== '' && blue >= 0 ? parseInt(blue) : 0;
        },
        setOpacity : function(opacity){
            this.opacity = opacity !== '' && opacity >= 0 ? parseInt(opacity) : '';
        },
        setOffsetColor : function(offsetColor){
            this.offsetColor = offsetColor !== '' && offsetColor >= 0 ? parseInt(offsetColor) : 3;
        },
        setIsPart : function(isPart){
            this.isPart = isPart !== '' && isPart > 0 ? parseInt(isPart) : 0;
        },
        drawingImg : function(){
            var rotate = this.rotate%4;
            var img = this.img;
            if(img == null) return false;
            var canvasWidth = this.width;
            var canvasHeight = this.height;
            var canvas = this.canvas;
            var ctx = canvas.getContext("2d");
            if(rotate == 1 || rotate == 3){
                var tmp = canvasHeight;
                canvasHeight = canvasWidth;
                canvasWidth = tmp;
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate((90 * rotate) * Math.PI / 180);

            //抗锯齿
            if(this.srcImgWidth > this.width*2 && this.type != 'image/png'){
                var oc   = document.createElement('canvas'),
                    octx = oc.getContext('2d');
                oc.width  = this.srcImgWidth;
                oc.height = this.srcImgHeight;
                octx.drawImage(img, 0, 0, oc.width, oc.height);
                var steps = Math.ceil(Math.log(this.srcImgWidth / this.width) / Math.log(2))-1;
                for(var i = 0; i < steps; i++) {
                    octx.drawImage(oc, 0, 0, oc.width*0.5, oc.height*0.5);
                }
                ctx.drawImage(oc, 0, 0, oc.width* Math.pow(0.5, steps), oc.height* Math.pow(0.5, steps), -this.width / 2, -this.height / 2, this.width, this.height);
            }else{
                var oc   = document.createElement('canvas'),
                    octx = oc.getContext('2d');
                oc.width  = img.width;
                oc.height = img.height;
                octx.drawImage(img, 0, 0, oc.width, oc.height);
                ctx.drawImage(oc, 0, 0, oc.width, oc.height, -this.width / 2, -this.height / 2, this.width, this.height);
            }

            var imgData = ctx.getImageData(0,0,canvasWidth,canvasHeight);
            //抠图
            if(this.cropBox != ''){
                var cropBox   = document.createElement('canvas'),
                    cropCtx = cropBox.getContext('2d');
                cropBox.width = this.cropBox.naturalWidth;
                cropBox.height = this.cropBox.naturalHeight;
                cropCtx.drawImage(this.cropBox,0,0);
                var filter = [];
                var filterArr = [];
                var pixel = '';
                var cropCtxData = cropCtx.getImageData(0,0,cropBox.width,cropBox.height);
                for (var j = 0; j<cropCtxData.data.length; j=j+4){
                    pixel = cropCtxData.data[j]+','+cropCtxData.data[j+1]+','+cropCtxData.data[j+2]+','+cropCtxData.data[j+3];
                    if($.inArray(pixel,filter) < 0){
                        filter.push(pixel);
                    }
                }
                for(var j in filter){
                    filterArr[j] = filter[j].split(",");
                    filterArr[j][0] = parseInt(filterArr[j][0]);
                    filterArr[j][1] = parseInt(filterArr[j][1]);
                    filterArr[j][2] = parseInt(filterArr[j][2]);
                }
                var offset = this.offsetColor;
                var imgX = parseInt(this.cropBoxInfo.x + this.cropBoxInfo.width);//½ØÍ¼×î´ó¿í¶È
                var imgY = parseInt(this.cropBoxInfo.y + this.cropBoxInfo.height);//½ØÍ¼×î´ó¸ß¶È
                //Ñ¡Ôñ¾Ö²¿´¦Àí
                if(this.isPart > 0) {
                    for (var i = 0; i<imgData.data.length; i+=4){
                        if ( ((i / 4) % this.width) >= this.cropBoxInfo.x && ((i / 4) % this.width) <= imgX && ((i / 4) / this.width) >= this.cropBoxInfo.y && ((i / 4) / this.width) <= imgY ) {
                            for (var j = 0; j < filterArr.length; j = j + 1) {
                                if (
                                    ((filterArr[j][0] + filterArr[j][1] + filterArr[j][2]) >= ((imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) - offset) ) && ((filterArr[j][0] + filterArr[j][1] + filterArr[j][2]) <= ((imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) + offset) ) && ((filterArr[j][0] >= imgData.data[i] - offset) && (filterArr[j][1] >= imgData.data[i + 1] - offset) && (filterArr[j][2] >= imgData.data[i + 2] - offset)) && ((filterArr[j][0] <= imgData.data[i] + offset) && (filterArr[j][1] <= imgData.data[i + 1] + offset) && (filterArr[j][2] <= imgData.data[i + 2] + offset))) {//´æÔÚÌæ»»Êý×éÖÐµÄÏñËØ²Å½øÐÐÌæ»»
                                    if (this.targetColor != '' && this.targetColor != undefined) {
                                        imgData.data[i] = this.targetColor[0];//red
                                        imgData.data[i + 1] = this.targetColor[1];//green
                                        imgData.data[i + 2] = this.targetColor[2];//blue
                                    } else {
                                        imgData.data[i] = 255;//red
                                        imgData.data[i + 1] = 255;//green
                                        imgData.data[i + 2] = 255;//blue
                                    }
                                    imgData.data[i + 3] = this.opacity !== '' && this.opacity >= 0 ? this.opacity : imgData.data[i + 3];
                                    break;
                                } else {
                                    if (this.targetColor != '' && this.targetColor != undefined) {
                                        imgData.data[i] = this.targetColor[0];//red
                                        imgData.data[i + 1] = this.targetColor[1];//green
                                        imgData.data[i + 2] = this.targetColor[2];//blue
                                    } else {
                                        imgData.data[i] = 255;//red
                                        imgData.data[i + 1] = 255;//green
                                        imgData.data[i + 2] = 255;//blue
                                    }
                                    imgData.data[i + 3] = this.opacity !== '' && this.opacity >= 0 ? this.opacity : imgData.data[i + 3];
                                }
                            }
                        }
                    }
                }else{
                    for (var i = 0; i<imgData.data.length; i+=4) {
                        for (var j = 0; j < filterArr.length; j = j + 1) {
                            if (
                                ((filterArr[j][0] + filterArr[j][1] + filterArr[j][2]) >= ((imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) - offset) ) && ((filterArr[j][0] + filterArr[j][1] + filterArr[j][2]) <= ((imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) + offset) ) && ((filterArr[j][0] >= imgData.data[i] - offset) && (filterArr[j][1] >= imgData.data[i + 1] - offset) && (filterArr[j][2] >= imgData.data[i + 2] - offset)) && ((filterArr[j][0] <= imgData.data[i] + offset) && (filterArr[j][1] <= imgData.data[i + 1] + offset) && (filterArr[j][2] <= imgData.data[i + 2] + offset))) {//´æÔÚÌæ»»Êý×éÖÐµÄÏñËØ²Å½øÐÐÌæ»»
                                if (this.targetColor != '' && this.targetColor != undefined) {
                                    imgData.data[i] = this.targetColor[0];//red
                                    imgData.data[i + 1] = this.targetColor[1];//green
                                    imgData.data[i + 2] = this.targetColor[2];//blue
                                } else {
                                    imgData.data[i] = 255;//red
                                    imgData.data[i + 1] = 255;//green
                                    imgData.data[i + 2] = 255;//blue
                                }
                                imgData.data[i + 3] = this.opacity !== '' && this.opacity >= 0 ? this.opacity : imgData.data[i + 3];
                                break;
                            } else {
                                imgData.data[i] = imgData.data[i] + this.red;//red
                                imgData.data[i + 1] = imgData.data[i + 1] + this.green;//green
                                imgData.data[i + 2] = imgData.data[i + 2] + this.blue;//blue
                                imgData.data[i + 3] = this.opacity !== '' && this.opacity >= 0 ? this.opacity : imgData.data[i + 3];
                            }
                        }
                    }
                }
            }else{
                for (var i = 0; i<imgData.data.length; i=i+4){
                    imgData.data[i] = imgData.data[i] + this.red;//red
                    imgData.data[i+1] = imgData.data[i+1] + this.green;//green
                    imgData.data[i+2] = imgData.data[i+2] + this.blue;//blue
                    imgData.data[i+3] = this.opacity !== '' && this.opacity >= 0 ? this.opacity : imgData.data[i+3];
                }
            }

            ctx.putImageData(imgData,0,0);
            var url = canvas.toDataURL(this.type, this.encoderOptions);
            var imgData = dataURLtoBlob(url);
            this.imgData.Blob = imgData;
            this.imgData.url = getObjectURL(imgData);
            return this.imgData;
        }
    }

    //»ñÈ¡±¾µØÍ¼Æ¬Ô¤ÀÀµÄµØÖ·
    function getObjectURL(file) {
        var url = null ;
        if (window.createObjectURL!=undefined) { // basic
            url = window.createObjectURL(file) ;
        } else if (window.URL!=undefined) { // mozilla(firefox)
            url = window.URL.createObjectURL(file) ;
        } else if (window.webkitURL!=undefined) { // webkit or chrome
            url = window.webkitURL.createObjectURL(file) ;
        }
        return url ;
    }

    /**
     * base64转Blob
     * @param dataurl
     */
    function dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    /**
     * Blob转base64
     * @param dataurl
     */
    function blobToDataURL(blob, callback) {
        var a = new FileReader();
        a.onload = function (e) { callback(e.target.result); }
        a.readAsDataURL(blob);
    }
})(jQuery,window,document)