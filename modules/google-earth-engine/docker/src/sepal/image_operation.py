import ee
import math


class ImageOperation(object):
    def __init__(self, image):
        super(ImageOperation, self).__init__()
        self.image = image
        self.input_band_names = image.bandNames()

    def set(self, name, toAdd, args={}):
        toAdd = self.toImage(toAdd, args)
        self.image = self.image.addBands(toAdd.rename([name]), None, True)

    def setIf(self, name, condition, trueValue, falseValue):
        condition = self.toImage(condition)
        trueMasked = self.toImage(trueValue).mask(self.toImage(condition))
        falseMasked = self.toImage(falseValue).mask(self.invertMask(condition))
        value = trueMasked.unmask(falseMasked)
        self.set(name, value)

    def invertMask(self, mask):
        return mask.multiply(-1).add(1)

    def toImage(self, band, args={}):
        if isinstance(band, basestring):
            if band.find('.') > -1 or band.find(' ') > -1 or band.find('{') > -1:
                band = self.image.expression(self.format(band, args), {'i': self.image})
            else:
                band = self.image.select(band)

        return ee.Image(band)

    def format(self, s, args={}):
        if not args:
            args = {}
        allArgs = self.merge({'pi': math.pi}, args)
        result = str(s).format(**allArgs)

        if result.find('{') > -1:
            return format(result, args)
        return result

    def merge(self, o1, o2):
        return dict(list(o1.iteritems()) + list(o2.iteritems()))
