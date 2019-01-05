(module
 (type $v (func))
 (type $iii (func (param i32 i32) (result i32)))
 (import "env" "memory" (memory $0 0))
 (import "module" "callJSFunction" (func $assembly/module/callJSFunction))
 (table $0 1 anyfunc)
 (elem (i32.const 0) $null)
 (export "memory" (memory $0))
 (export "table" (table $0))
 (export "add" (func $assembly/module/add))
 (start $start)
 (func $assembly/module/add (; 1 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  get_local $0
  get_local $1
  i32.add
 )
 (func $start (; 2 ;) (type $v)
  call $assembly/module/callJSFunction
 )
 (func $null (; 3 ;) (type $v)
  nop
 )
)
