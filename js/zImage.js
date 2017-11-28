;(function($,window,document,undefined){

    $.fn.zImage = function(options){
        return new zImage(this,options);
    }

    /**
     * 图片处理类
     * @param that  this对象
     * @param rotate    旋转角度
     * @param customWidth   自定义图片宽度
     * @param customHeight  自定义图片高度
     * @param imgData  生成的图片数据
     * @param red  滤镜，红色
     * @param green  滤镜，绿色
     * @param blue  滤镜，蓝色
     * @param opacity  透明度，0透明，255不透明。
     */
    var zImage = function(that,options){
        var img= new Image();
        img.onload = function(){}
        img.src = that.attr('src');
        this.srcImgWidth = img.width ? img.width : that.width();
        this.srcImgHeight = img.height ? img.height : that.height();
        this.canvas = document.createElement('canvas');
        this.that = that;
        this.width = options.customWidth ? options.customWidth : this.srcImgWidth;
        this.height = options.customHeight ? options.customHeight : this.srcImgHeight;
        this.rotate = options.rotate;
        this.targetId = options.targetId;
        this.imgData = {};
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.opacity = '';
        return this;
    }

    zImage.prototype = {
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
        DrawingImg : function(){
            var rotate = this.rotate%4;
            var img = this.that[0];
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

            //抗锯齿，大图变小
            if(this.srcImgWidth > this.width*2){
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
            }else{//抗锯齿
                var oc   = document.createElement('canvas'),
                    octx = oc.getContext('2d');
                oc.width  = img.width*2;
                oc.height = img.height*2;
                octx.drawImage(img, 0, 0, oc.width, oc.height);
                ctx.drawImage(oc, 0, 0, oc.width, oc.height, -this.width / 2, -this.height / 2, this.width, this.height);
            }

            var imgData = ctx.getImageData(0,0,canvasWidth,canvasHeight);
            for (var i = 0; i<imgData.data.length; i=i+4){
                imgData.data[i] = imgData.data[i] + this.red;//red
                imgData.data[i+1] = imgData.data[i+1] + this.green;//green
                imgData.data[i+2] = imgData.data[i+2] + this.blue;//blue
                imgData.data[i+3] = this.opacity !== '' && this.opacity >= 0 ? this.opacity : imgData.data[i+3];
            }
            ctx.putImageData(imgData,0,0);
            var url = canvas.toDataURL()
            var imgData = dataURLtoBlob(url);
            this.imgData.Blob = imgData;
            this.imgData.url = getObjectURL(imgData);
            return this.imgData;
        }
    }

    //生成本地预览
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
     * base64×ªBlob
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
     * Blob×ªbase64
     * @param dataurl
     */
    function blobToDataURL(blob, callback) {
        var a = new FileReader();
        a.onload = function (e) { callback(e.target.result); }
        a.readAsDataURL(blob);
    }
})(jQuery,window,document)