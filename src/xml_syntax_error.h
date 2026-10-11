// Copyright 2009, Squish Tech, LLC.
#ifndef SRC_XML_SYNTAX_ERROR_H_
#define SRC_XML_SYNTAX_ERROR_H_

#include <libxml/xmlerror.h>

#include "libxmljs.h"

namespace libxmljs {

// Context struct passed as the void* userdata to libxml2's structured error
// callback. Carries both the Napi::Env (needed to create JS values) and a
// pointer to the Napi::Array that errors are pushed onto.
struct XmlSyntaxErrorContext {
  Napi::Env env;
  Napi::Array *errors;
  // Stop collecting once this many errors were pushed. Malformed input can
  // produce one diagnostic per few bytes, and each becomes a JS Error.
  uint32_t max_errors;
  uint32_t count;
};

// Default for the `maxErrors` option of parsing and validation.
const uint32_t kDefaultMaxErrors = 10000;

// Read `maxErrors` from an options value (anything that isn't an object
// means "use the default"). Infinity, or any value of 2^32 - 1 or more,
// means no limit. Returns false with a TypeError pending for a negative,
// NaN or non-numeric value.
bool GetMaxErrors(Napi::Env env, Napi::Value options, uint32_t &out);

// basically being used like a namespace
class XmlSyntaxError {
public:
  // push xmlError onto a Napi::Array
  // Matches the xmlStructuredErrorFunc signature: void(*)(void*, xmlErrorPtr)
  // The context pointer must be a XmlSyntaxErrorContext*.
  static void PushToArray(void *context, xmlError *error);

  // create a Napi Error object for the syntax error
  static Napi::Value BuildSyntaxError(Napi::Env env, xmlError *error);
};

} // namespace libxmljs

#endif // SRC_XML_SYNTAX_ERROR_H_
