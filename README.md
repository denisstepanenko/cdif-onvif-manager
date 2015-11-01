Introduction
------------
CDIF's ONVIF module implementation

### Notes to ONVIF support in CDIF
The original ONVIF Profile S specification is written in WSDL and quite complex. It is possible to convert it into JSON format and present to clients, then map back to SOAP calls when clients need to access ONVIF based devices. However this approach maybe not make many sense because it adds extra efforts to client developers to get familiar with the whole ONVIF spec. Therefore, a simplified approach is taken such that we map [ONVIF library](https://github.com/agsh/onvif) APIs to CDIF's common device model. This gave us a much cleaner API interface, but for now only provides a few fundamental functionality because the underlying library implementation is still improving. In the future we may improve this over time while present clients a much simplified interface.


See following links for more details: <br/>

[Common device interconnect framework](https://github.com/out4b/cdif)

[ONVIF node.js library](https://github.com/agsh/onvif)
