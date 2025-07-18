"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Scissors, Download } from "lucide-react"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function ImageCropper() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setCropArea({ x: 0, y: 0, width: 0, height: 0 })
        setCroppedImageUrl(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      const { offsetWidth, offsetHeight } = imageRef.current

      setImageDimensions({
        width: offsetWidth,
        height: offsetHeight,
      })

      // Set initial crop area to center of image
      const initialSize = Math.min(offsetWidth, offsetHeight) * 0.5
      setCropArea({
        x: (offsetWidth - initialSize) / 2,
        y: (offsetHeight - initialSize) / 2,
        width: initialSize,
        height: initialSize,
      })
    }
  }

  const getRelativeCoordinates = (event: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const constrainToBounds = (area: CropArea): CropArea => {
    const maxX = imageDimensions.width - area.width
    const maxY = imageDimensions.height - area.height

    return {
      x: Math.max(0, Math.min(maxX, area.x)),
      y: Math.max(0, Math.min(maxY, area.y)),
      width: Math.max(10, Math.min(imageDimensions.width - area.x, area.width)),
      height: Math.max(10, Math.min(imageDimensions.height - area.y, area.height)),
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!selectedImage) return

    const coords = getRelativeCoordinates(event)
    setIsDragging(true)
    setDragStart(coords)
    setCropArea({ x: coords.x, y: coords.y, width: 0, height: 0 })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedImage) return

    const coords = getRelativeCoordinates(event)
    const newArea = {
      x: Math.min(dragStart.x, coords.x),
      y: Math.min(dragStart.y, coords.y),
      width: Math.abs(coords.x - dragStart.x),
      height: Math.abs(coords.y - dragStart.y),
    }

    setCropArea(constrainToBounds(newArea))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCoordinateChange = (field: keyof CropArea, value: string) => {
    const numValue = Number.parseInt(value) || 0
    const newArea = { ...cropArea, [field]: numValue }
    setCropArea(constrainToBounds(newArea))
  }

  const generateCroppedImage = useCallback(() => {
    if (!selectedImage || !imageRef.current || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = imageRef.current
    const scaleX = img.naturalWidth / img.offsetWidth
    const scaleY = img.naturalHeight / img.offsetHeight

    // Set canvas size to crop area size
    canvas.width = cropArea.width * scaleX
    canvas.height = cropArea.height * scaleY

    // Draw the cropped portion
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    // Convert to blob URL for download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        setCroppedImageUrl(url)
      }
    })
  }, [selectedImage, cropArea])

  const applyCrop = () => {
    console.log("Crop coordinates:", cropArea)
    console.log("Original image dimensions:", {
      natural: imageRef.current
        ? {
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight,
          }
        : null,
      displayed: imageDimensions,
    })

    generateCroppedImage()
  }

  const downloadCroppedImage = () => {
    if (croppedImageUrl) {
      const link = document.createElement("a")
      link.href = croppedImageUrl
      link.download = "cropped-image.png"
      link.click()
    }
  }

  useEffect(() => {
    if (cropArea.width > 0 && cropArea.height > 0) {
      generateCroppedImage()
    }
  }, [cropArea, generateCroppedImage])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Interactive Image Cropping Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File Upload */}
              <div className="flex items-center gap-4">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Upload className="w-4 h-4" />
                    Choose Image
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
                {selectedImage && <span className="text-sm text-gray-600">Image loaded successfully</span>}
              </div>

              {selectedImage && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Image Display and Cropping Area */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Original Image</h3>
                    <div
                      ref={containerRef}
                      className="relative inline-block border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        ref={imageRef}
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected"
                        className="max-w-full h-auto"
                        onLoad={handleImageLoad}
                        draggable={false}
                      />

                      {/* Crop Area Overlay */}
                      {cropArea.width > 0 && cropArea.height > 0 && (
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                          style={{
                            left: cropArea.x,
                            top: cropArea.y,
                            width: cropArea.width,
                            height: cropArea.height,
                            pointerEvents: "none",
                          }}
                        >
                          {/* Corner handles */}
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls and Preview */}
                  <div className="space-y-6">
                    {/* Coordinate Inputs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Crop Coordinates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="x-coord">X Position</Label>
                            <Input
                              id="x-coord"
                              type="number"
                              value={Math.round(cropArea.x)}
                              onChange={(e) => handleCoordinateChange("x", e.target.value)}
                              min="0"
                              max={imageDimensions.width}
                            />
                          </div>
                          <div>
                            <Label htmlFor="y-coord">Y Position</Label>
                            <Input
                              id="y-coord"
                              type="number"
                              value={Math.round(cropArea.y)}
                              onChange={(e) => handleCoordinateChange("y", e.target.value)}
                              min="0"
                              max={imageDimensions.height}
                            />
                          </div>
                          <div>
                            <Label htmlFor="width">Width</Label>
                            <Input
                              id="width"
                              type="number"
                              value={Math.round(cropArea.width)}
                              onChange={(e) => handleCoordinateChange("width", e.target.value)}
                              min="10"
                              max={imageDimensions.width}
                            />
                          </div>
                          <div>
                            <Label htmlFor="height">Height</Label>
                            <Input
                              id="height"
                              type="number"
                              value={Math.round(cropArea.height)}
                              onChange={(e) => handleCoordinateChange("height", e.target.value)}
                              min="10"
                              max={imageDimensions.height}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Crop Preview */}
                    {cropArea.width > 0 && cropArea.height > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Crop Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <canvas
                              ref={previewCanvasRef}
                              className="max-w-full h-auto border border-gray-300 rounded"
                            />
                            <div className="flex gap-2">
                              <Button onClick={applyCrop} className="flex-1">
                                <Scissors className="w-4 h-4 mr-2" />
                                Apply Crop
                              </Button>
                              {croppedImageUrl && (
                                <Button onClick={downloadCroppedImage} variant="outline">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Current Selection Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Selection Info</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <p>
                            <strong>Position:</strong> ({Math.round(cropArea.x)}, {Math.round(cropArea.y)})
                          </p>
                          <p>
                            <strong>Size:</strong> {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
                          </p>
                          <p>
                            <strong>Image Size:</strong> {imageDimensions.width} × {imageDimensions.height} px
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {!selectedImage && (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload an image to start cropping</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
