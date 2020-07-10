import ipywidgets as widgets
from traitlets import Unicode, Bytes, List, Int

class Autolight(widgets.DOMWidget):
    _view_name = Unicode('AutolightView').tag(sync=True)
    _view_module = Unicode('autolight').tag(sync=True)
    _view_module_version = Unicode('0.1.0').tag(sync=True)
    
    blocks = List(Int()).tag(sync=True) # end idx of each block
    dtypes = List(Unicode()).tag(sync=True)    # format of the data chunk
    data = Bytes().tag(sync=True)       # light data
    def __init__(self, data=None, **kwargs):
        super(Autolight, self).__init__(**kwargs)
        if data is not None:
            self.play(data)
    
    def prepare(self, data):
        '''
        Prepares the scene by setting the blocks and formats traitlets
        '''
        l_blocks = list()
        l_dtypes = list()
        
        for i,ld in enumerate(data):
            l_blocks.append(ld.size)
            l_dtypes.append('uint8')
            
        self.blocks = l_blocks
        self.dtypes = l_dtypes
    
    def update(self, data):
        l_data = list()
        
        for i,ld in enumerate(data):
            l_data.append(ld.tobytes())
        self.data = b''.join(l_data)
        
    def show(self, data):
        self.prepare(data)
#         self.update(data)
        
    def play(self, data, fs=44100 / 1024): # array of numpy arrays
        self.prepare(data)
        
        for d in data:
            self.update(data)
