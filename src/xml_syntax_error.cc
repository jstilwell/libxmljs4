// Copyright 2009, Squish Tech, LLC.

#include <cmath>
#include <cstring>

#include "xml_syntax_error.h"

namespace {

void set_string_field(Napi::Object obj, const char *name, const char *value) {
  if (!value) {
    return;
  }
  obj.Set(name, Napi::String::New(obj.Env(), value));
}

void set_numeric_field(Napi::Object obj, const char *name, const int value) {
  obj.Set(name, Napi::Number::New(obj.Env(), value));
}

} // anonymous namespace

namespace libxmljs {

Napi::Value XmlSyntaxError::BuildSyntaxError(Napi::Env env, xmlError *error) {
  Napi::Value err =
      Napi::Error::New(env, error->message ? error->message : "").Value();
  Napi::Object out = err.As<Napi::Object>();

  set_numeric_field(out, "domain", error->domain);
  set_numeric_field(out, "code", error->code);
  set_string_field(out, "message", error->message);
  set_numeric_field(out, "level", error->level);
  set_numeric_field(out, "column", error->int2);
  set_string_field(out, "file", error->file);
  set_numeric_field(out, "line", error->line);
  set_string_field(out, "str1", error->str1);
  set_string_field(out, "str2", error->str2);
  set_string_field(out, "str3", error->str3);

  // only add if we have something interesting
  if (error->int1) {
    set_numeric_field(out, "int1", error->int1);
  }

  return err;
}

bool GetMaxErrors(Napi::Env env, Napi::Value options, uint32_t &out) {
  out = kDefaultMaxErrors;
  if (!options.IsObject()) {
    return true;
  }
  Napi::Value value = options.As<Napi::Object>().Get("maxErrors");
  if (env.IsExceptionPending()) {
    return false;
  }
  if (value.IsUndefined()) {
    return true;
  }
  double number = value.IsNumber() ? value.As<Napi::Number>().DoubleValue()
                                   : std::nan("");
  if (std::isnan(number) || (number < 0)) {
    Napi::TypeError::New(env, "maxErrors must be a non-negative number")
        .ThrowAsJavaScriptException();
    return false;
  }
  out = (number >= 4294967295.0) ? UINT32_MAX : static_cast<uint32_t>(number);
  return true;
}

void XmlSyntaxError::PushToArray(void *context, xmlError *error) {
  XmlSyntaxErrorContext *ctx = reinterpret_cast<XmlSyntaxErrorContext *>(context);
  if (ctx->count >= ctx->max_errors) {
    return;
  }
  ctx->count++;
  Napi::Env env = ctx->env;
  Napi::Array errors = *(ctx->errors);

  Napi::Value pushVal = errors.Get("push");
  Napi::Function push = pushVal.As<Napi::Function>();
  push.Call(errors, {XmlSyntaxError::BuildSyntaxError(env, error)});
}

} // namespace libxmljs
