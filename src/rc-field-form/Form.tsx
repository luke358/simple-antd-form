import FieldContext from "./FieldContext";
import { FormInstance } from "./interface";
import { useForm, Callbacks } from "./useForm";

export type FormProps = {
  form?: FormInstance;
  children?: React.ReactNode;
} & Callbacks

export function Form({form, children, onFinish, onFinishFailed, ... restProps}: FormProps) {
  const [formInstance] = useForm(form);
  const { setCallbacks } = formInstance;

  setCallbacks({
    onFinish,
    onFinishFailed,
  });
  const wrapperNode = (
    <FieldContext.Provider value={formInstance}>
      {children}
    </FieldContext.Provider>
  )

  return (
    <form
    {...restProps}
    onSubmit={e => {
      e.preventDefault();
      e.stopPropagation();
      formInstance.submit();
    }}>
      {wrapperNode}
    </form>
  )
}