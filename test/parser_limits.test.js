const libxml = require('../index');

// Sibling elements each containing a bare '&': one error per element, without
// the nesting that would stop the parse at libxml2's depth limit.
function malformed(count) {
  return '<r>' + '<a>&</a>'.repeat(count) + '</r>';
}

describe('maxErrors', () => {
  it('collects at most 10000 errors by default', () => {
    const doc = libxml.parseXml(malformed(12000), { recover: true });
    expect(doc.errors.length).toBe(10000);
  });

  it('honors a custom limit for XML and HTML', () => {
    expect(
      libxml.parseXml(malformed(50), { recover: true, maxErrors: 5 }).errors
    ).toHaveLength(5);
    expect(
      libxml.parseHtml('<p>' + '<a>&#xZZ;</b>'.repeat(50), { maxErrors: 3 })
        .errors
    ).toHaveLength(3);
  });

  it('collects everything with Infinity', () => {
    const doc = libxml.parseXml(malformed(12000), {
      recover: true,
      maxErrors: Infinity,
    });
    expect(doc.errors.length).toBe(12000);
  });

  it('rejects invalid values', () => {
    for (const maxErrors of [-1, NaN, '5', null]) {
      expect(() => libxml.parseXml('<r/>', { maxErrors })).toThrow(TypeError);
    }
  });

  it('applies to schema validation', () => {
    const xsd = libxml.parseXml(
      '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">' +
        '<xs:element name="r" type="xs:int"/></xs:schema>'
    );
    const doc = libxml.parseXml('<x/>');

    expect(doc.validate(xsd)).toBe(false);
    expect(doc.validationErrors).toHaveLength(1);

    doc.validate(xsd, { maxErrors: 0 });
    expect(doc.validationErrors).toHaveLength(0);
  });
});

describe('old option', () => {
  // U+2070 may start a name under XML 1.0 5th edition but not under the
  // 4th edition rules that old10 (and its alias old) select.
  const doc = '<\u2070/>';

  it('is an alias for old10', () => {
    expect(() => libxml.parseXml(doc)).not.toThrow();
    expect(() => libxml.parseXml(doc, { old10: true })).toThrow();
    expect(() => libxml.parseXml(doc, { old: true })).toThrow();
  });
});
