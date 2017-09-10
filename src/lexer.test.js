import Lex, { NodeTypes, resolveNodes, resolveNodesNumbers } from "./lexer";
import { isEqual } from "lodash";

var cases = [
  // This variable forked from xml.js https://github.com/nashwaan/xml-js under the MIT licence
  {
    desc: "declaration",
    xml: "<?xml?>",
    lex: [[NodeTypes.XML_DECLARATION, 2, 5]]
  },
  {
    desc: "declaration with space",
    xml: "<?xml ?>",
    lex: [[NodeTypes.XML_DECLARATION, 2, 5]]
  },
  {
    desc: "declaration with non-wellformed closing",
    xml: "<?xml>",
    lex: [[NodeTypes.XML_DECLARATION, 2, 5]]
  },
  {
    desc: "processing instruction",
    xml: "<?xml-?>",
    lex: [[NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 6]]
  },
  {
    desc: "declaration with attributes",
    xml: '<?xml version="1.0"?>',
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ATTRIBUTE_NODE, 6, 13, 15, 18]
    ]
  },
  {
    desc: "declaration with attribute following whitespace",
    xml: '<?xml version="1.0" ?>',
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ATTRIBUTE_NODE, 6, 13, 15, 18]
    ]
  },
  {
    desc: "declaration with attribute single quotes",
    xml: "<?xml version='1.0'?>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ATTRIBUTE_NODE, 6, 13, 15, 18]
    ]
  },
  {
    desc: "declaration with two attributes",
    xml: "<?xml version='1.0' lang=\"en\"    ?>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ATTRIBUTE_NODE, 6, 13, 15, 18],
      [NodeTypes.ATTRIBUTE_NODE, 20, 24, 26, 28]
    ]
  },
  {
    desc: "declaration with two attributes close together",
    xml: "<?xml version='1.0'lang=\"en\"     ?>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ATTRIBUTE_NODE, 6, 13, 15, 18],
      [NodeTypes.ATTRIBUTE_NODE, 19, 23, 25, 27]
    ]
  },
  {
    desc: "Processing instruction with attribute",
    xml: '<?xml-stylesheet href="1.0"?>',
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21, 23, 26]
    ]
  },
  {
    desc: "Processing instruction with valueless attribute",
    xml: "<?xml-stylesheet href?>",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21]
    ]
  },
  {
    desc:
      "Processing instruction with valueless attribute followed by regular attribute",
    xml: "<?xml-stylesheet href yahoo='serious'?>",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21],
      [NodeTypes.ATTRIBUTE_NODE, 22, 27, 29, 36]
    ]
  },
  {
    desc:
      "Processing instruction with valueless attribute followed by regular attribute without speechmarks",
    xml: "<?xml-stylesheet href yahoo=serious?>",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21],
      [NodeTypes.ATTRIBUTE_NODE, 22, 27, 28, 35]
    ]
  },
  {
    desc:
      "Processing instruction with valueless attribute followed by regular attribute without speechmarks malformed closing",
    xml: "<?xml-stylesheet href yahoo=serious>",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21],
      [NodeTypes.ATTRIBUTE_NODE, 22, 27, 28, 35]
    ]
  },
  {
    desc:
      "Processing instruction with valueless attribute followed by regular attribute without speechmarks malformed closing followed by valueless name",
    xml: "<?xml-stylesheet href yahoo=serious x>",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21],
      [NodeTypes.ATTRIBUTE_NODE, 22, 27, 28, 35],
      [NodeTypes.ATTRIBUTE_NODE, 36, 37]
    ]
  },
  {
    desc:
      "Processing instruction with valueless attribute followed by regular attribute without speechmarks malformed closing followed by valueless name",
    xml: "<?xml-stylesheet href xx>",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21],
      [NodeTypes.ATTRIBUTE_NODE, 22, 24]
    ]
  },
  {
    desc:
      "Processing instruction with valueless attribute followed by regular attribute without speechmarks malformed closing followed by valueless name and a space",
    xml: "<?xml-stylesheet href xx >",
    lex: [
      [NodeTypes.PROCESSING_INSTRUCTION_NODE, 2, 16],
      [NodeTypes.ATTRIBUTE_NODE, 17, 21],
      [NodeTypes.ATTRIBUTE_NODE, 22, 24]
    ]
  },
  {
    desc: "declaration and self-closing element",
    xml: "<?xml?><a/>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.CLOSE_ELEMENT]
    ]
  },
  {
    desc: "declaration and element",
    xml: "<?xml?><a>",
    lex: [[NodeTypes.XML_DECLARATION, 2, 5], [NodeTypes.ELEMENT_NODE, 8, 9]]
  },
  {
    desc: "declaration and two elements",
    xml: "<?xml?><a><b>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.ELEMENT_NODE, 11, 12]
    ]
  },
  {
    desc: "declaration and two elements (one self-closing)",
    xml: "<?xml?><a/><b>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.ELEMENT_NODE, 12, 13]
    ]
  },
  {
    desc: "declaration and two elements (one closing)",
    xml: "<?xml?><a></a><b>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.ELEMENT_NODE, 15, 16]
    ]
  },
  {
    desc: "declaration and two elements (one self-closing)",
    xml: "<?xml?><a></a><b/>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.ELEMENT_NODE, 15, 16],
      [NodeTypes.CLOSE_ELEMENT]
    ]
  },
  {
    desc: "element followed by text",
    xml: "<a>text",
    lex: [[NodeTypes.ELEMENT_NODE, 1, 2], [NodeTypes.TEXT_NODE, 3, 8]]
  },
  {
    desc: "element surrounded by text",
    xml: " <a>text",
    lex: [
      [NodeTypes.TEXT_NODE, 0, 1],
      [NodeTypes.ELEMENT_NODE, 2, 3],
      [NodeTypes.TEXT_NODE, 4, 9]
    ]
  },
  {
    desc: "comment",
    xml: "<!-- test -->",
    lex: [[NodeTypes.COMMENT_NODE, 4, 10]]
  },
  {
    desc: "comment with text before",
    xml: "a<!-- test -->",
    lex: [[NodeTypes.TEXT_NODE, 0, 1], [NodeTypes.COMMENT_NODE, 5, 11]]
  },
  {
    desc: "comment with text before and after",
    xml: "a<!-- test -->b",
    lex: [
      [NodeTypes.TEXT_NODE, 0, 1],
      [NodeTypes.COMMENT_NODE, 5, 11],
      [NodeTypes.TEXT_NODE, 14, 16]
    ]
  },
  {
    desc: "self-closing element",
    xml: "<a/>",
    lex: [[NodeTypes.ELEMENT_NODE, 1, 2], [NodeTypes.CLOSE_ELEMENT]]
  },
  {
    desc: "non-self-closing element",
    xml: "<a>",
    lex: [[NodeTypes.ELEMENT_NODE, 1, 2]]
  },
  {
    desc: "nested elements",
    xml: "<a><b/></a>",
    lex: [
      [NodeTypes.ELEMENT_NODE, 1, 2],
      [NodeTypes.ELEMENT_NODE, 4, 5],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.CLOSE_ELEMENT]
    ]
  },
  {
    desc: "declaration and elements",
    xml: "<?xml?><a><b/></a>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.ELEMENT_NODE, 11, 12],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.CLOSE_ELEMENT]
    ]
  },
  {
    desc: "declaration and elements with attributes",
    xml: "<?xml?><a href='http://html5zombo.com'><b/></a>",
    lex: [
      [NodeTypes.XML_DECLARATION, 2, 5],
      [NodeTypes.ELEMENT_NODE, 8, 9],
      [NodeTypes.ATTRIBUTE_NODE, 10, 14, 16, 37],
      [NodeTypes.ELEMENT_NODE, 40, 41],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.CLOSE_ELEMENT]
    ]
  },
  {
    desc: "declaration with weird self-closing",
    xml: "<?xml/>",
    lex: [[NodeTypes.XML_DECLARATION, 2, 5], [NodeTypes.CLOSE_ELEMENT]]
  },
  {
    desc: "Doctype",
    xml: `<!DOCTYPE html PUBLIC
  "-//W3C//DTD XHTML 1.0 Transitional//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`,
    lex: [
      [NodeTypes.DOCUMENT_TYPE_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 10, 14],
      [NodeTypes.ATTRIBUTE_NODE, 15, 21],
      [NodeTypes.ATTRIBUTE_NODE, 25, 63],
      [NodeTypes.ATTRIBUTE_NODE, 68, 123]
    ]
  },
  {
    desc: "Doctype followed by text",
    xml: `<!DOCTYPE html PUBLIC
  "-//W3C//DTD XHTML 1.0 Transitional//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">ab`,
    lex: [
      [NodeTypes.DOCUMENT_TYPE_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 10, 14],
      [NodeTypes.ATTRIBUTE_NODE, 15, 21],
      [NodeTypes.ATTRIBUTE_NODE, 25, 63],
      [NodeTypes.ATTRIBUTE_NODE, 68, 123],
      [NodeTypes.TEXT_NODE, 125, 128]
    ]
  },
  {
    desc: "HTML5 followed by html root tag",
    xml: `<!DOCTYPE html><html>`,
    lex: [
      [NodeTypes.DOCUMENT_TYPE_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 10, 14],
      [NodeTypes.ELEMENT_NODE, 16, 20]
    ]
  },
  {
    desc: "CDATA Section",
    xml: `<![CDATA[ \t <foo></bar> \t ]]>`,
    lex: [[NodeTypes.CDATA_SECTION_NODE, 9, 26]]
  },
  {
    desc: "CDATA Section followed by text",
    xml: `<![CDATA[ \t <foo></bar> \t ]]>abc`,
    lex: [[NodeTypes.CDATA_SECTION_NODE, 9, 26], [NodeTypes.TEXT_NODE, 29, 33]]
  },
  {
    desc: "Entity",
    xml: `<!ENTITY entityname "replacement text">`,
    lex: [
      [NodeTypes.ENTITY_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 9, 19],
      [NodeTypes.ATTRIBUTE_NODE, 21, 37]
    ]
  },
  {
    desc: "Entity followed by text",
    xml: `<!ENTITY entityname "replacement text">a`,
    lex: [
      [NodeTypes.ENTITY_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 9, 19],
      [NodeTypes.ATTRIBUTE_NODE, 21, 37],
      [NodeTypes.TEXT_NODE, 39, 41]
    ]
  },
  {
    desc: "Doctype with entity definitions",
    xml: `<!DOCTYPE y [
   <!ENTITY % b '&#37;c;'>
   <!ENTITY % c '&#60;!ENTITY a "x" >'>
   %b;
  ]>
  <y>&a;</y>`,
    lex: [
      [NodeTypes.DOCUMENT_TYPE_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 10, 11],
      [NodeTypes.ATTRIBUTE_NODE, 12, 91],
      [NodeTypes.TEXT_NODE, 92, 95],
      [NodeTypes.ELEMENT_NODE, 96, 97],
      [NodeTypes.TEXT_NODE, 98, 101],
      [NodeTypes.CLOSE_ELEMENT]
    ]
  },
  {
    desc: "Notation element followed by text",
    xml: `<!NOTATION name identifier "helper" >a`,
    lex: [
      [NodeTypes.NOTATION_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 11, 15],
      [NodeTypes.ATTRIBUTE_NODE, 16, 26],
      [NodeTypes.ATTRIBUTE_NODE, 28, 34],
      [NodeTypes.TEXT_NODE, 37, 39]
    ]
  },
  {
    desc: "Weird <[ ... ]> syntax (maybe shorthand CDATA?) I once saw",
    xml: `<[a<b></a>]>a`,
    lex: [[NodeTypes.CDATA_SECTION_NODE, 2, 10], [NodeTypes.TEXT_NODE, 12, 14]]
  },
  {
    desc: "HTML5 example",
    xml: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Title of the document</title>
</head>

<body>
Content of the document......
</body>

</html> `,
    lex: [
      [NodeTypes.DOCUMENT_TYPE_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 10, 14],
      [NodeTypes.TEXT_NODE, 15, 16],
      [NodeTypes.ELEMENT_NODE, 17, 21],
      [NodeTypes.TEXT_NODE, 22, 23],
      [NodeTypes.ELEMENT_NODE, 24, 28],
      [NodeTypes.TEXT_NODE, 29, 30],
      [NodeTypes.ELEMENT_NODE, 31, 35],
      [NodeTypes.ATTRIBUTE_NODE, 36, 43, 45, 50],
      [NodeTypes.TEXT_NODE, 52, 53],
      [NodeTypes.ELEMENT_NODE, 54, 59],
      [NodeTypes.TEXT_NODE, 60, 81],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.TEXT_NODE, 89, 90],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.TEXT_NODE, 97, 99],
      [NodeTypes.ELEMENT_NODE, 100, 104],
      [NodeTypes.TEXT_NODE, 105, 136],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.TEXT_NODE, 143, 145],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.TEXT_NODE, 152, 154]
    ]
  },
  {
    desc: "HTML5 example with multiple file input",
    xml: `<!DOCTYPE html> <p><input type="file" multiple></p> `,
    lex: [
      [NodeTypes.DOCUMENT_TYPE_NODE],
      [NodeTypes.ATTRIBUTE_NODE, 10, 14],
      [NodeTypes.TEXT_NODE, 15, 16],
      [NodeTypes.ELEMENT_NODE, 17, 18],
      [NodeTypes.ELEMENT_NODE, 20, 25],
      [NodeTypes.ATTRIBUTE_NODE, 26, 30, 32, 36],
      [NodeTypes.ATTRIBUTE_NODE, 38, 46],
      [NodeTypes.CLOSE_ELEMENT],
      [NodeTypes.TEXT_NODE, 51, 53]
    ]
  }
];

describe("lexes", async () =>
  cases.forEach((eachCase, i) => {
    test(`${eachCase.desc} ${eachCase.xml}`, async () => {
      let result;
      try {
        result = await Lex(eachCase.xml);
      } catch (e) {
        console.log(e);
      }

      if (!isEqual(result, eachCase.lex)) {
        console.log("Not equal");
        console.log(resolveNodesNumbers(eachCase.xml, result));
        console.log("after");
        try {
          result = await Lex(eachCase.xml, true);
        } catch (e) {}
        if (result) {
          console.log("Result:", result, " from ", eachCase.xml);
          console.log(resolveNodes(eachCase.xml, result));
        }
      } else {
        // if (i === cases.length - 1) {
        //   console.log(resolveNodes(eachCase.xml, result));
        // }
      }

      expect(result).toEqual(eachCase.lex);
    });
  }));
