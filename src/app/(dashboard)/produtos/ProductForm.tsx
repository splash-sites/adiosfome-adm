'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createProductAction, updateProductAction, type FormState } from './actions';
import type { Category, Product } from '@/domain/entities/Product';

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
      className="flex flex-col gap-4 rounded border p-4"
    >
      {isEdit && <input type="hidden" name="productId" value={product!.id} />}
      {isEdit && <input type="hidden" name="currentImageUrl" value={product?.imageUrl ?? ''} />}
      <input type="hidden" name="variants" value={variantsJson} />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Imagem</p>
        {currentImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentImage} alt="" className="h-24 w-24 rounded object-cover" />
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
          className="text-sm"
        />
        {isEdit && product?.imageUrl && !preview && (
          <label className="flex items-center gap-2 text-sm">
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

      <label className="flex flex-col gap-1 text-sm">
        Nome do produto
        <input
          name="name"
          type="text"
          required
          defaultValue={product?.name}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Descricao
        <textarea
          name="description"
          defaultValue={product?.description}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Categoria
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId}
          className="rounded border px-3 py-2"
        >
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
        Ativo (visivel no cardapio)
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Sabores/variacoes</p>
        {variants.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nome (ex: Media)"
              value={v.name}
              onChange={(e) => updateVariant(i, 'name', e.target.value)}
              required
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Preco"
              value={v.price}
              onChange={(e) => updateVariant(i, 'price', e.target.value)}
              required
              className="w-28 rounded border px-3 py-2 text-sm"
            />
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="text-sm text-red-600 underline"
              >
                Remover
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addVariant} className="self-start text-sm underline">
          + adicionar variante
        </button>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? 'Aguarda...' : isEdit ? 'Salvar' : 'Criar produto'}
      </button>
    </form>
  );
}
