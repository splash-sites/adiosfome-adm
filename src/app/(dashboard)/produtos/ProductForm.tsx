'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createProductAction, updateProductAction, type FormState } from './actions';
import type { Category, Product } from '@/domain/entities/Product';
import { Button } from '@/components/ui/Button';
import { cardClass, inputClass, labelClass } from '@/components/ui/styles';

const initialState: FormState = { error: null };

type VariantRow = { name: string; price: string };

export function ProductForm({
  categories,
  product,
  onDone,
}: {
  categories: Category[];
  product?: Product;
  onDone?: () => void;
}) {
  const isEdit = Boolean(product);
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [variants, setVariants] = useState<VariantRow[]>(
    product && product.variants.length > 0
      ? product.variants.map((v) => ({ name: v.name, price: String(v.price) }))
      : [{ name: '', price: '' }]
  );

  const updateVariant = (index: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariant = () => setVariants((prev) => [...prev, { name: '', price: '' }]);
  const removeVariant = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));

  const variantsJson = JSON.stringify(
    variants.map((v) => ({ name: v.name, price: Number(v.price) || 0 }))
  );

  const submittedRef = useRef(false);
  useEffect(() => {
    if (submittedRef.current && !pending && state.error === null) {
      onDone?.();
    }
  }, [state, pending, onDone]);

  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoveImage(false);
  };

  const currentImage = removeImage ? null : preview ?? product?.imageUrl ?? null;

  return (
    <form
      action={formAction}
      onSubmit={() => {
        submittedRef.current = true;
      }}
      className={`${cardClass} flex flex-col gap-4 p-5`}
    >
      {isEdit && <input type="hidden" name="productId" value={product!.id} />}
      {isEdit && <input type="hidden" name="currentImageUrl" value={product?.imageUrl ?? ''} />}
      <input type="hidden" name="variants" value={variantsJson} />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-black/70">Imagem</p>
        <div className="flex items-center gap-3">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt=""
              className="h-20 w-20 rounded-xl border border-black/8 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-black/15 text-xs text-black/30">
              sem foto
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-black/60 file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-black/10"
            />
            {isEdit && product?.imageUrl && !preview && (
              <label className="flex items-center gap-2 text-sm text-black/60">
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                />
                Remover imagem atual
              </label>
            )}
          </div>
        </div>
      </div>

      <label className={labelClass}>
        Nome do produto
        <input name="name" type="text" required defaultValue={product?.name} className={inputClass} />
      </label>

      <label className={labelClass}>
        Descricao
        <textarea name="description" defaultValue={product?.description} className={inputClass} />
      </label>

      <label className={labelClass}>
        Categoria
        <select name="categoryId" required defaultValue={product?.categoryId} className={inputClass}>
          <option value="" disabled>
            Escolhe uma categoria
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-black/70">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
        Ativo (visivel no cardapio)
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-black/70">Sabores/variacoes</p>
        {variants.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nome (ex: Media)"
              value={v.name}
              onChange={(e) => updateVariant(i, 'name', e.target.value)}
              required
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Preco"
              value={v.price}
              onChange={(e) => updateVariant(i, 'price', e.target.value)}
              required
              className={`w-28 ${inputClass}`}
            />
            {variants.length > 1 && (
              <Button type="button" variant="ghost" onClick={() => removeVariant(i)}>
                Remover
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addVariant} className="self-start">
          + adicionar variante
        </Button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Aguarda...' : isEdit ? 'Salvar' : 'Criar produto'}
      </Button>
    </form>
  );
}
