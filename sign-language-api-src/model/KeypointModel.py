from typing import List
from torch import Tensor, nn

from .modules import KeypointsEmbedding, PositionalEncoding, TokenEmbedding


class KeypointModel(nn.Module):

    def __init__(self,
                src_max_len: int,
                tgt_max_len: int,
                keys_amount: int,
                tgt_vocab_size: int,
                kernel_size: int = 5,
                emb_size: int = 64,
                keys_initial_emb_size: int = 128,
                ):
        super(KeypointModel, self).__init__()

        # in_features is the result of flattening the input of (x,y,c).(k1, ..., k42)
        self.keys_emb = KeypointsEmbedding(keys_amount=keys_amount, kernel_size=kernel_size, emb_size=emb_size, keys_initial_emb_size=keys_initial_emb_size)
        self.src_pe = PositionalEncoding(emb_size=emb_size, max_len=(src_max_len - kernel_size + 1))
        self.tgt_tok_emb = TokenEmbedding(tgt_vocab_size, emb_size)
        self.tgt_pe = PositionalEncoding(emb_size=emb_size, max_len=tgt_max_len)
        self.transformer = nn.Transformer(d_model=emb_size)
        self.generator = nn.Linear(emb_size, tgt_vocab_size)
        

    def forward(self,
                src: List[Tensor],
                tgt: Tensor,
                src_mask: Tensor,
                tgt_mask: Tensor,
                src_padding_mask: Tensor,
                tgt_padding_mask: Tensor,
                memory_key_padding_mask: Tensor):
        src_emb = self.src_pe(self.keys_emb(src).permute(2,0,1)) # changes shape to (Len, Batch, Emb)
        tgt_emb = self.tgt_pe(self.tgt_tok_emb(tgt))
        outs = self.transformer(src_emb, tgt_emb, src_mask, tgt_mask, None,
                                src_padding_mask, tgt_padding_mask, memory_key_padding_mask)
        return self.generator(outs)

    def encode(self, src: Tensor, src_mask: Tensor):
        src_emb = self.src_pe(self.keys_emb(src).permute(2,0,1))
        return self.transformer.encoder(src_emb, src_mask)

    def decode(self, tgt: Tensor, memory: Tensor, tgt_mask: Tensor):
        return self.transformer.decoder(self.tgt_pe(self.tgt_tok_emb(tgt)), memory, tgt_mask)