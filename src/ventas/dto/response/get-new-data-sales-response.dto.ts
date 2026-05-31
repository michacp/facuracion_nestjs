import { ApiProperty } from '@nestjs/swagger';
import { FindProductsIdNameResponseDto } from '../../../items/dto/response/find-products-idname-response.dto';
import { IdNameDto, TaxItemDto } from '../../../catalogos/dto/response/catalogos-shared.dto';


export class GetNewDataSalesResponseDto {
    @ApiProperty({ type: [FindProductsIdNameResponseDto] })
    productos!: FindProductsIdNameResponseDto[];

    @ApiProperty({ type: [TaxItemDto] })
    impuestos!: TaxItemDto[];

    @ApiProperty({ type: [IdNameDto] })
    vouchertype!: IdNameDto[];

    @ApiProperty({ type: [IdNameDto] })
    formapago!: IdNameDto[];
}