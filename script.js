function readNIFTI(data) {
  var canvas = document.getElementById("myCanvas");
  var slider = document.getElementById("myRange");
  var niftiHeader, niftiImage;

  // parse nifti
  if (nifti.isCompressed(data)) {
    data = nifti.decompress(data);
  }

  if (nifti.isNIFTI(data)) {
    niftiHeader = nifti.readHeader(data);
    niftiImage = nifti.readImage(niftiHeader, data);
  }

  // set up slider
  var slices = niftiHeader.dims[3];
  slider.max = slices - 1;
  slider.value = Math.round(slices / 2);
  slider.oninput = function () {
    drawCanvas(canvas, slider.value, niftiHeader, niftiImage);
  };

  // draw slice
  drawCanvas(canvas, slider.value, niftiHeader, niftiImage);
}

function drawCanvas(canvas, slice, niftiHeader, niftiImage) {
  // get nifti dimensions
  var cols = niftiHeader.dims[1];
  var rows = niftiHeader.dims[2];

  // set canvas dimensions to nifti slice dimensions
  canvas.width = cols;
  canvas.height = rows;

  // make canvas image data
  var ctx = canvas.getContext("2d");
  var canvasImageData = ctx.createImageData(canvas.width, canvas.height);

  // convert raw data to typed array based on nifti datatype
  var typedData;

  if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT8) {
    typedData = new Uint8Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT16) {
    typedData = new Int16Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT32) {
    typedData = new Int32Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT32) {
    typedData = new Float32Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT64) {
    typedData = new Float64Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT8) {
    typedData = new Int8Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT16) {
    typedData = new Uint16Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT32) {
    typedData = new Uint32Array(niftiImage);
  } else {
    return;
  }

  // offset to specified slice
  var sliceSize = cols * rows;
  var sliceOffset = sliceSize * slice;

  // draw pixels
  for (var row = 0; row < rows; row++) {
    var rowOffset = row * cols;

    for (var col = 0; col < cols; col++) {
      var offset = sliceOffset + rowOffset + col;
      var value = typedData[offset];

      /* 
             Assumes data is 8-bit, otherwise you would need to first convert 
             to 0-255 range based on datatype range, data range (iterate through
             data to find), or display range (cal_min/max).
             
             Other things to take into consideration:
               - data scale: scl_slope and scl_inter, apply to raw value before 
                 applying display range
               - orientation: displays in raw orientation, see nifti orientation 
                 info for how to orient data
               - assumes voxel shape (pixDims) is isometric, if not, you'll need 
                 to apply transform to the canvas
               - byte order: see littleEndian flag
          */
      canvasImageData.data[(rowOffset + col) * 4] = value & 0xff;
      canvasImageData.data[(rowOffset + col) * 4 + 1] = value & 0xff;
      canvasImageData.data[(rowOffset + col) * 4 + 2] = value & 0xff;
      canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xff;
    }
  }

  ctx.putImageData(canvasImageData, 0, 0);
}

function readFile(file) {
  var blob = file.slice(0, file.size);

  var reader = new FileReader();

  reader.onload = function (evt) {
    if (evt.target.readyState === FileReader.DONE) {
      readNIFTI(evt.target.result);
    }
  };

  reader.readAsArrayBuffer(blob);
}

const urlParams = new URLSearchParams(window.location.search);
const proxyURL = "https://cors-proxy-express-server.herokuapp.com/getFile?fileurl="
const downloadURL = `${proxyURL}${urlParams.get('downloadURL')}`;

fetch(downloadURL).then(res => res.arrayBuffer()).then(arrBuff => {
  console.log(arrBuff)
  readNIFTI(arrBuff);
}).catch(err => {
  console.error(err);
});