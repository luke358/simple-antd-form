import React, { useEffect } from "react";
import FieldContext from "./FieldContext";
import { FieldEntity, FormInstance, NamePath, Rule, RuleError, RuleObject, ValidateOptions } from "./interface";
import { validateRules } from "./utils/validateUtils";


interface InternalFieldProps {
  children?: React.ReactElement;
  name: string;
  fieldContext: FormInstance;
  rules?: Rule[];
  dependencies: NamePath[]
}

interface ChildProps {
  [name: string]: any;
}
class Field extends React.Component<InternalFieldProps> {
  public static contextType = FieldContext;
  private mounted = false;
  private cancelRegisterFunc: (() => void) | null = null;

  errors: string[] = []
  warnings: string[] = []

  componentDidMount() {
    this.mounted = true;
    const { fieldContext } = this.props;
    const { registerField } = fieldContext;
    this.cancelRegisterFunc = registerField(this);
  }
  componentWillUnmount() {
    this.cancelRegisterFunc && this.cancelRegisterFunc();
  }

  public getRules = (): RuleObject[] => {
    const { rules = [], fieldContext } = this.props;

    return rules.map((rule: Rule): RuleObject => {
      if (typeof rule === 'function') {
        return rule(fieldContext);
      }
      return rule;
    });
  };
  public validateRules(options?: ValidateOptions): Promise<RuleError[]> {
    const { getFieldValue } = this.props.fieldContext;
    const currentValue = getFieldValue(this.props.name);


    const rootPromise = Promise.resolve().then(() => {
      if (!this.mounted) {
        return [];
      }
      // 1. 获取 filterRules 这里其实还过滤出与当前校验的 triggerName 一致的规则。
      // 我们这里都是 onChange，所以就不作过滤了。
      let filteredRules = this.getRules();


      // 2. 调用工具函数 validateRules 进行校验，这一部分我们就不实现了，具体的过程在第一篇文章中已经分析过了。
      // 如果忘了，可以再翻回去看看。
      const promise = validateRules(
        [this.props.name],
        currentValue,
        filteredRules,
        options!,
        true
      );

      // 3. 处理校验结果
      promise
        .catch((e) => e)
        .then((ruleErrors: RuleError[] = []) => {
          // 将校验结果保存起来
          // Get errors & warnings
          const nextErrors: string[] = [];
          const nextWarnings: string[] = [];
          ruleErrors.forEach(({ rule: { warningOnly }, errors = [] }) => {
            if (warningOnly) {
              nextWarnings.push(...errors);
            } else {
              nextErrors.push(...errors);
            }
          });

          this.errors = nextErrors;
          this.warnings = nextWarnings;

          this.reRender();
        });

      // 4. 返回 promise 对象
      // 注意，这里返回的是 promise 对象，而不是 promise.catch(...).then(...) 之后的结果。
      // 也就是说，promise 处理了两次。
      // 第一次是上边这部分代码，将校验结果保存到了 this.errors 和 this.warnings 中，
      // 第二次是返回给 form 实例之后，再次处理。目的是将所有 fields 的校验信息收集起来，统一处理。
      return promise;
    });
    return rootPromise;
  }

  public reRender() {
    if (!this.mounted) return;
    this.forceUpdate();
  }
  public onStoreChange: FieldEntity['onStoreChange'] = (prevStore, namePath, info) => {
    const namePathMatch = namePath && namePath.some(name => name === this.props.name)
    switch (info.type) {
      case 'dependenciesUpdate': {
        const { dependencies } = this.props;

        if (dependencies) {
          const dependenciesMatch = namePath.some((name) =>
            dependencies.includes(name)
          );
          if (dependenciesMatch) {
            this.reRender();
            return;
          }
        }
      }
      default:
        if (namePathMatch) {
          this.reRender()
          return;
        }
    }
  }

  public getControlled = (props: ChildProps) => {
    const { fieldContext, name } = this.props;
    const { getFieldValue, setFieldValue, dispatch } = fieldContext;
    return {
      value: getFieldValue(name),
      onChange: (e: any) => {
        // 获取输入值
        const newValue = e.target?.value;
        // 更新 store 中存储的值
        dispatch({
          type: 'updateValue',
          namePath: name,
          value: newValue
        })

        // 进行表单校验
        dispatch({
          type: "validateField",
          namePath: name,
          triggerName: "onChange",
        });
      },
    };
  };

  public render() {
    const { children } = this.props;

    // 如果 children 的类型是 function 的话，我们直接执行函数
    if (typeof children === "function") {
      return (children as Function)();
    }
    // clone 子元素，注入 value 和 onChange 事件 (这里目前只考虑正常情况)
    const returnChild = React.cloneElement(
      children as React.ReactElement,
      this.getControlled((children as React.ReactElement).props)
    );

    // 错误显示
    return <div style={{paddingBottom: 20, position: 'relative'}}>
      {returnChild}
      <div style={{position: 'absolute'}}>{this.errors.length > 0 ? this.errors[0] : ''}</div>
    </div>
  }
}

export default function WrapperField({ name, ...restProps }: any) {
  const fieldContext = React.useContext(FieldContext);

  return <Field key={name} name={name} {...restProps} fieldContext={fieldContext} />
}