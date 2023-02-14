import { Callbacks, ValuedNotifyInfo } from './useForm';
import type { ReactElement } from 'react';
import { ReducerAction } from "./useForm";

export interface ValidateErrorEntity<Values = any> {
  values: Values;
  errorFields: { name: InternalNamePath; errors: string[] }[];
  outOfDate: boolean;
}
export type InternalNamePath = (string | number)[];
export type NamePath = string | number;

export type StoreValue = any;
export type Store = Record<string, StoreValue>;

export interface FieldEntity {
  // 目前只用到 onStoreChange 方法
  onStoreChange: (
    store: Store,
    namePathList: NamePath[],
    info: ValuedNotifyInfo, // info 的类型我们之后再补充
  ) => void;
  props: {
    name?: NamePath;
    rules?: Rule[];
    dependencies?: NamePath[];
    initialValue?: any;
  };
  validateRules: (options?: ValidateOptions) => Promise<RuleError[]>;
}

export interface RuleError {
  errors: string[];
  rule: RuleObject;
}

export interface FieldError {
  name: NamePath;
  errors: string[];
  warnings: string[];
}


export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email';
interface BaseRule {
  warningOnly?: boolean;
  enum?: StoreValue[];
  len?: number;
  max?: number;
  message?: string | ReactElement;
  min?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: StoreValue) => StoreValue;
  type?: RuleType;
  whitespace?: boolean;

  /** Customize rule level `validateTrigger`. Must be subset of Field `validateTrigger` */
  validateTrigger?: string | string[];
}
type Validator = (
  rule: RuleObject,
  value: StoreValue,
  callback: (error?: string) => void,
) => Promise<void | any> | void;
export interface ValidatorRule {
  warningOnly?: boolean;
  message?: string | ReactElement;
  validator: Validator;
}
type AggregationRule = BaseRule & Partial<ValidatorRule>;

interface ArrayRule extends Omit<AggregationRule, 'type'> {
  type: 'array';
  defaultField?: RuleObject;
}

export type RuleObject = AggregationRule | ArrayRule;

export type RuleRender = (form: FormInstance) => RuleObject;

export type Rule = RuleObject | RuleRender;


export interface ValidateOptions {
  triggerName?: string;
  validateMessages?: ValidateMessages;
  /**
   * Recursive validate. It will validate all the name path that contains the provided one.
   * e.g. ['a'] will validate ['a'] , ['a', 'b'] and ['a', 1].
   */
  recursive?: boolean;
}
export interface FormInstance<Values = any> {
  getFieldValue: (name: NamePath) => StoreValue;
  getFieldsValue: () => Values;
  setFieldValue: (name: NamePath, value: Values) => void;
  setFieldsValue: (values: Values) => void;

  registerField: (entity: FieldEntity) => (() => void) | null; // 同样补充 registerField 的定义

  dispatch: (action: ReducerAction) => void;
  submit: () => void;

  setCallbacks: (callbacks: Callbacks) => void
}

type ValidateMessage = string | (() => string);
export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage;
  enum?: ValidateMessage;
  whitespace?: ValidateMessage;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage;
    method?: ValidateMessage;
    array?: ValidateMessage;
    object?: ValidateMessage;
    number?: ValidateMessage;
    date?: ValidateMessage;
    boolean?: ValidateMessage;
    integer?: ValidateMessage;
    float?: ValidateMessage;
    regexp?: ValidateMessage;
    email?: ValidateMessage;
    url?: ValidateMessage;
    hex?: ValidateMessage;
  };
  string?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  number?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  array?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  pattern?: {
    mismatch?: ValidateMessage;
  };
}