(module
 (type $iii (func (param i32 i32) (result i32)))
 (type $iv (func (param i32)))
 (type $v (func))
 (import "env" "memory" (memory $0 1))
 (data (i32.const 8) "\1c\00\00\00c\00a\00l\00l\00i\00n\00g\00 \00a\00d\00d\00 \00f\00u\00n\00c\00t\00i\00o\00n\00 \00i\00n\00 \00w\00a\00s\00m")
 (import "module" "log" (func $assembly/module/log (param i32)))
 (table $0 1 anyfunc)
 (elem (i32.const 0) $null)
 (export "memory" (memory $0))
 (export "table" (table $0))
 (export "add" (func $assembly/module/add))
 (func $assembly/module/add (; 1 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  i32.const 8
  call $assembly/module/log
  get_local $0
  get_local $1
  i32.add
 )
 (func $null (; 2 ;) (type $v)
  nop
 )
)
