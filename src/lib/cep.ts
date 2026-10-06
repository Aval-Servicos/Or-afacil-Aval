export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.erro) return null;

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err);
    return null;
  }
}

export function formatCep(val: string): string {
  const clean = val.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return clean;
}

export function formatPhone(val: string): string {
  const clean = val.replace(/\D/g, '').slice(0, 11);
  if (clean.length > 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length > 6) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  if (clean.length > 2) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  }
  return clean;
}

export function formatCpfCnpj(val: string): string {
  const clean = val.replace(/\D/g, '');
  if (clean.length <= 11) {
    // CPF
    return clean
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ
  return clean
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
