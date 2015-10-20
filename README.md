Introduction
------------
CDIF's ONVIF module implementation

See following links for more details: <br/>


[Common device interconnect framework](https://github.com/out4b/cdif)

[ONVIF node.js library](https://github.com/agsh/onvif)

### Notes to ONVIF support in CDIF
The original ONVIF Profile S specification is written in WSDL and very complex. It is possible to convert it into JSON format and present to clients, then map back to SOAP calls when clients want to access the ONVIF based device, it might not make many sense to take this approach. Therefore, we took a simplified approach to map ONVIF APIs in the device model according to [ONVIF node.js library](https://github.com/agsh/onvif) APIs. This provides only a partial functionality but we can improve that over time while present clients a much simplified interface.
