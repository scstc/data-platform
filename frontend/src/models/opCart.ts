import { useCallback, useState } from 'react';

/**
 * 算子市场 →「新建加工任务」的"待编排算子"购物车。
 * Umi Max 全局 model:跨页共享(市场页加入,加工页带出并预选)。
 */
export default function useOpCart() {
  const [ops, setOps] = useState<string[]>([]);

  const add = useCallback(
    (name: string) =>
      setOps((prev) => (prev.includes(name) ? prev : [...prev, name])),
    [],
  );
  const remove = useCallback(
    (name: string) => setOps((prev) => prev.filter((n) => n !== name)),
    [],
  );
  const clear = useCallback(() => setOps([]), []);

  return { ops, add, remove, clear };
}
